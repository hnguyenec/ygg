export interface SerializableJSON {
  fromJSON: (data: any) => this;
  toJSON: () => any;
}

export function toJSONDeep(obj: any = {}): any {
  const data = {};
  try {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const property = obj[key];
        if (
          property === undefined ||
          property === null ||
          typeof property === 'function'
        ) {
          continue;
        } else if (typeof property.toJSON === 'function') {
          data[key] = property.toJSON();
        } else {
          try {
            data[key] = JSON.parse(JSON.stringify(property));
          } catch (error) {
            console.error(error);
            console.error(
              `JSON.parse error on parsing data["${key}"], the data set as:`
            );
            console.error(data);
          }
        }
      }
    }
  } catch (error) {
    const wrapError = new Error(
      `toJSONDeep(): Failed to convert to JSON.\n${error.message}`
    );
    throw wrapError;
  }
  return data;
}
