import List from "list.js";

class Birth {

  constructor(text) {
    this.persons = this.getPersons(text);
    this.valueNames = ["name", "rus", { name: "iso", attr: "data-iso" }];
    this.searchColumns = ["name"];
    this.listItem = `<div class="flex justify-between gap-5 py-4 border-b border-gray-600"><div class="name text-left"></div><div class="rus iso text-right"></div></div>`;
    this.paginationItem = `<li class="group"><a class="page w-10 h-10 bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white group-[.active]:bg-blue-800 group-[.active]:text-gray-200 p-4 inline-flex items-center text-sm font-medium rounded-full transition-all" href="#"></a></li>`;
    this.paginationInner = 1;
    this.paginationOuter = 1;
    this.pageItems = 10;
    this.emptyDay = "В этот день никто не родился";
    this.emptyWeek = "В ближайшие дни никто не родился";
    this.emptyMonth = "В этом месяце никто не родился";
    this.list = [];
  }

  addList = (id) => {
    this.list[id] = new List(id, this.getOptions(id), this.filterPersons(id));
    this.list[id].remove("iso", "0");
  }

  getPersons = (text) => {
    const rows = text.split("\r\n");
    const persons = rows.map((row) => {
      const fields = row.split(",");
      const dmy = fields[1].split(".");
      const date = new Date(Number(dmy[2]), Number(dmy[1]) - 1, Number(dmy[0]));
      if (isNaN(date.getTime())) return false;
      const name = fields[0];
      const rus = this.getRusDate(date);
      const iso = this.getIsoDate(date);
      const birth = this.getIsoDate(date, "birth");
      const month = this.getIsoDate(date, "month");
      return { name: name, rus: rus, iso: iso, birth: birth, month: month };
    });
    return persons.filter(person => person);
  }

  getOptions = (id) => {
    const options = {
      valueNames: this.valueNames,
      searchColumns: this.searchColumns,
      item: this.listItem,
    }
    if (id === "all") {
      options.pagination = {
        item: this.paginationItem,
        innerWindow: this.paginationInner,
        outerWindow: this.paginationOuter,
      };
      options.page = this.pageItems;
    }
    return options;
  }

  filterPersons = (id) => {
    switch (id) {
      case "day":
        return this.currentDayPersons();
      case "soon":
        return this.nextWeekPersons();
      case "month":
        return this.currentMonthPersons();
      default:
        return this.allPersons();
    }
  }

  currentDayPersons = () => {
    const now = new Date();
    const birth = this.getIsoDate(now, "birth");
    let persons = this.persons.filter(person => person.birth === birth);
    if (persons.length) {
      persons = this.sortByName(persons);
    } else {
      const rus = this.getRusDate(now, "birth");
      persons = [{ name: this.emptyDay, rus: rus }];
    }
    return persons;
  }

  nextWeekPersons = () => {
    const min = new Date();
    min.setDate(min.getDate() + 1);
    const from = this.getIsoDate(min, "birth");
    const max = new Date();
    max.setDate(max.getDate() + 7);
    const to = this.getIsoDate(max, "birth");
    let persons = this.persons.filter(person => person.birth >= from && person.birth <= to);
    if (persons.length) {
      persons = this.sortByBirth(persons);
    } else {
      const rus = this.getRusDate(min, "birth") + " - " + this.getRusDate(max, "birth");
      persons = [{ name: this.emptyWeek, rus: rus }];
    }
    return persons;
  }

  currentMonthPersons = () => {
    const now = new Date();
    const month = this.getIsoDate(now, "month");
    this.selectMonth(month);
    return this.monthPersons(month);
  }


  selectMonth = (month) => {
    const select = document.querySelector("select.month");
    if (!select) return;
    let option;
    for (let i = 0; i < 12; i++) {
      option = document.createElement("option");
      option.value = (i + 1).toString().padStart(2, "0")
      option.text = this.getMonthName(option.value);
      select.add(option);
    }
    select.value = month;
    select.addEventListener("change", () => {
      this.list["month"].clear();
      this.list["month"].add(this.monthPersons(select.value));
    });
  }

  monthPersons = (month) => {
    let persons = this.persons.filter(person => person.month === month);
    if (persons.length) {
      persons = this.sortByBirth(persons);
    } else {
      persons = [{ name: this.emptyMonth, rus: this.getMonthName(month) }];
    }
    return persons;
  }

  allPersons = () => {
    // return this.sortByName(this.persons);
    return this.persons;
  }

  sortByName = (persons) => {
    return persons.sort((a, b) => {
      if (a.name > b.name) return 1;
      else if (a.name < b.name) return -1;
      else return 0;
    });
  }

  sortByBirth = (persons) => {
    return persons.sort((a, b) => {
      if (a.birth > b.birth) return 1;
      else if (a.birth < b.birth) return -1;
      else return 0;
    });
  }

  getIsoDate = (date, format = "full") => {
    let parts;
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    switch (format) {
      case "birth":
        parts = [month, day];
        break;
      case "month":
        parts = [month];
        break;
      default:
        parts = [year, month, day];
    }
    return parts.join("-");
  }

  getRusDate = (date, format = "full") => {
    let options;
    switch (format) {
      case "birth":
        options = { day: "numeric", month: "short" };
        break;
      case "month":
        options = { month: "long" };
        break;
      default:
        options = { day: "numeric", month: "short", year: "numeric" };
    }
    return date.toLocaleDateString("ru-RU", options).replace(" г.", "");
  }

  getMonthName = (month) => {
    const months = [
      "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
    ];
    return months[Number(month) - 1];
  }

}

fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vT-5j3rZHVbVl3fdH6Up-V_eRkb35Qb6Hev1cY0FQgi6RKGrinIiJdDkBno-XxPHMpKO_3MK6Npwakb/pub?gid=0&single=true&output=csv")
  .then(response => response.text())
  .then(text => {
    const birth = new Birth(text);
    birth.addList("day");
    birth.addList("soon");
    birth.addList("month");
    birth.addList("all");
  });