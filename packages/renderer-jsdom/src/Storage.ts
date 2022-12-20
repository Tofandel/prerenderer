
export default class Storage {
  private data: Record<string, string> = {}

  removeItem (key: string) {
    delete this.data[key]
  }

  getItem (key: string) {
    return this.data[key]
  }

  setItem (key: string, value: string) {
    this.data[key] = value
  }

  clear () {
    this.data = {}
  }
}
