import { PageObject } from '@ygg/shared/test/page-object';
import { Contact } from '@ygg/shared/omni-types/core';

export abstract class ContactControlPageObject extends PageObject {
  selectors = {
    main: 'ygg-contact-control',
    inputName: 'input#name',
    inputPhone: 'input#phone',
    inputEmail: 'input#email',
    inputLineID: 'input#lineID',
    buttonImportFromUser: 'button.import-from-user'
  };

  abstract setValue(contact: Contact): void;
  abstract expectValue(contact: Contact): void;
}
