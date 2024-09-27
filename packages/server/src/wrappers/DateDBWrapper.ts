import { DateInfo } from "iron-spider-ssdk";

export interface IDateDB {
  listDates(userId: string): Promise<DateInfo[]>;
  createDate(date: DateInfo): Promise<DateInfo>;
  getDate(id: string): Promise<DateInfo | undefined>;
  updateDate(date: DateInfo): Promise<DateInfo>;
  deleteDate(id: string): Promise<void>;
}

export class StubDateDB implements IDateDB {
  async listDates(userId: string): Promise<DateInfo[]> {
    // Stub implementation
    return [];
  }
  async createDate(date: DateInfo): Promise<DateInfo> {
    // Stub implementation
    return date;
  }

  async getDate(id: string): Promise<DateInfo | undefined> {
    // Stub implementation
    return undefined;
  }

  async updateDate(date: DateInfo): Promise<DateInfo> {
    // Stub implementation
    return date;
  }

  async deleteDate(id: string): Promise<void> {
    // Stub implementation
  }
}

//in memory db
export class InMemoryDb implements IDateDB {
  private dates: DateInfo[] = [];

  async listDates(userId: string): Promise<DateInfo[]> {
    return this.dates.filter(date => date.ownerId === userId);
  }

  async createDate(date: DateInfo): Promise<DateInfo> {
    this.dates.push(date);
    return date;
  }

  async getDate(id: string): Promise<DateInfo | undefined> {
    return this.dates.find(date => date.id === id) || undefined;
  }

  async updateDate(date: DateInfo): Promise<DateInfo> {
    const index = this.dates.findIndex(d => d.id === date.id);
    if (index !== -1) {
      this.dates[index] = date;
    }
    return date;
  }

  async deleteDate(id: string): Promise<void> {
    this.dates = this.dates.filter(date => date.id !== id);
  }
}
