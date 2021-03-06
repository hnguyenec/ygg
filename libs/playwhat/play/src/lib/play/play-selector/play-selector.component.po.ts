import { PageObject } from '@ygg/shared/test/page-object';
import { Play } from '../play';

export class PlaySelectorPageObject extends PageObject {
  selectors = {
    main: '.play-selector',
    buttonGotoCreatePlay: 'button.add-item'
  };

  getSelectorForPlay(arg1: Play | string): string {
    const id = typeof arg1 === 'string' ? arg1 : arg1.id;
    return `${this.getSelector()} [item-id="${id}"]`;
  }
}