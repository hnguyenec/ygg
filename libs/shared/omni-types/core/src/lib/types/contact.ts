import { SerializableJSON } from '@ygg/shared/infra/core';
import { extend, random, sample } from 'lodash';

interface User {
  name: string;
  phone: string;
  email: string;
  lineID?: string;
}

export class Contact implements SerializableJSON {
  userId?: string;
  name: string;
  phone: string;
  email: string;
  lineID?: string;

  static isContact(value: any): value is Contact {
    return value && value.name && (value.phone || value.email || value.lineID);
  }

  static forge(): Contact {
    const forged = new Contact();
    forged.name = sample(['馬＊久', '蔣＊虢', '李＊灰', '菜＊文', '陳＊匾']);
    forged.email = `taiwanNO${random(1, 10)}@ygmail.com`;
    forged.phone = `0987${random(100000, 1000000)
      .toString()
      .padStart(6, '0')}`;
    forged.lineID = sample([
      '上Y下G功德圓滿',
      '明治地寶寶你在欉三小？',
      '習維尼',
      'TaiwanNO1',
      'ILIKETOMOVEITMOVEIT',
      'yllekIMISSYOUTERRIBLY'
    ]);
    return forged;
  }

  constructor() {}

  fromUser(user: User): this {
    this.name = user.name;
    this.phone = user.phone;
    this.email = user.email;
    if (user.lineID) {
      this.lineID = user.lineID;
    }
    return this;
  }

  fromJSON(data: any = {}): this {
    if (Contact.isContact(data)) {
      extend(this, data);
    }
    return this;
  }

  toJSON(): any {
    return {
      name: this.name,
      phone: this.phone || '',
      email: this.email || '',
      lineID: this.lineID || ''
    };
  }
}
