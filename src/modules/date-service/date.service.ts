export class DateService {

  private _date: Date;
  private _day: string;
  private _month: string;
  private _year: string;
  private _hour: string;
  private _minute: string;

  constructor(timestamp: number) {
    this._date = new Date(timestamp);
  }

  public asFormattedDate(): string {
    const formattedDate: string = `${this._day}.${this._month}.${this._year} ${this._hour}:${this._minute}`;

    return formattedDate;
  }

  public getDay(): DateService {
    const day: string = `${this._date.getDate()}`;

    const dayIsOneChar: boolean = day.length === 1;

    this._day = dayIsOneChar ? `0${day}`
                             : day;

    return this;
  }

  public getMonth(): DateService {
    const month: string = `${this._date.getMonth() + 1}`;

    const monthIsOneChar: boolean = month.length === 1;

    this._month = monthIsOneChar ? `0${month}`
                                 : month;

    return this;
  }

  public getYear(): DateService {
    const year: string = `${this._date.getFullYear()}`;

    this._year = year;

    return this;
  }

  public getHours(): DateService {
    const hours: string = `${this._date.getHours()}`;

    const hourIsOneChar: boolean = hours.length === 1;

    this._hour = hourIsOneChar ? `0${hours}`
                               : hours;

    return this;
  }

  public getMinutes(): DateService {
    const minute: string = `${this._date.getMinutes()}`;

    const minuteIsOneChar: boolean = minute.length === 1;

    this._minute = minuteIsOneChar ? `0${minute}`
                                   : minute;

    return this;
  }
}
