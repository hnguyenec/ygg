import { AlertDialogPageObject } from '@ygg/shared/ui/widgets';
import { defaults } from 'lodash';

export class AlertDialogPageObjectCypress extends AlertDialogPageObject {
  expectClosed() {
    cy.get(this.getSelector(), { timeout: 10000 }).should('not.be.visible');
  }

  expectMessage(message: string, options?: any) {
    options = defaults(options, { timeout: 10000 });
    cy.get(this.getSelector('content'), options).should(
      'include.text',
      message.replace(/<[^>]+>/g, '')
    );
  }

  exepctIcon(iconName: string) {
    cy.get(this.getSelector('icon')).should('have.attr', 'icon-name', iconName);
  }

  // confirm(): void {
  //   cy.get(this.getSelector('buttonConfirm')).click();
  //   cy.get(this.getSelector()).should('not.be.visible');
  // }
}
