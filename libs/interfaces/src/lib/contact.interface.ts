export interface Contact {
  name: string;
  phone?: string;
  email?: string;
  lineID?: string;
  [propName: string]: any;
}