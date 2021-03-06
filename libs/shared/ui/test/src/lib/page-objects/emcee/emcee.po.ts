import { PageObject } from '@ygg/shared/test/page-object';
import {
  ConfirmDialogPageObjectCypress,
  AlertDialogPageObjectCypress,
  YggDialogPageObjectCypress
} from '../dialog';

export class EmceePageObjectCypress extends PageObject {
  selectors = {
    main: ''
  };

  confirm(
    message: string,
    options: {
      doConfirm?: boolean;
      // hasFollowedDialog?: boolean;
    } = { doConfirm: true }
  ) {
    const dialogPO = new YggDialogPageObjectCypress();
    const confirmDialogPO = new ConfirmDialogPageObjectCypress(
      dialogPO.getSelector()
    );
    confirmDialogPO.expectMessage(message);
    // cy.pause();
    if (options.doConfirm) {
      dialogPO.confirm();
    } else {
      dialogPO.cancel();
    }
    // // console.log(options);
    // if (!options.hasFollowedDialog) {
    //   confirmDialogPO.expectClosed();
    // }
  }

  alert(message: string, options?: any) {
    const dialogPO = new YggDialogPageObjectCypress();
    const alertDialogPO = new AlertDialogPageObjectCypress(
      dialogPO.getSelector()
    );
    alertDialogPO.expectMessage(message, options);
    // cy.pause();
    dialogPO.confirm();
    // alertDialogPO.expectClosed();
  }

  info(message: string, options?: any) 
  {    
    const dialogPO = new YggDialogPageObjectCypress();
    const alertDialogPO = new AlertDialogPageObjectCypress(
      dialogPO.getSelector()
    );
    alertDialogPO.exepctIcon('info');
    alertDialogPO.expectMessage(message, options);
    dialogPO.confirm();
  }

  cancel(message: string) {
    this.confirm(message, { doConfirm: false });
  }
}
