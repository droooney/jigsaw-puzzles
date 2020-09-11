import { Database, Migration } from 'idb-model';

const migrations: Migration[] = [
  (db) => {
    db.createObjectStore('puzzles', {
      keyPath: 'id',
    });
  },
];

class CustomDatabase extends Database {
  migrating = false;
  migrated = false;
  migrationProcess: Promise<any> | null = null;

  async getConnection(): Promise<IDBDatabase> {
    if (this.migrating) {
      await this.migrationProcess;
    } else if (!this.migrated) {
      this.migrating = true;

      await (this.migrationProcess = this.migrate(migrations));

      this.migrating = false;
      this.migrated = true;
    }

    return super.getConnection();
  }
}

export const db = new CustomDatabase('db');
