export class SiteNavigator {
  goto(path: string[] = []): Cypress.Chainable<any> {
    const fullPathName = `/${path.join('/')}`;
    cy.log(`Go to ${fullPathName}`);
    cy.get('.pw-header #to-home').click({ force: true });
    cy.location('pathname').should('eq', '/home');
    const route = path.shift();
    if (route === 'plays') {
      this.gotoPlays(path);
    } else if (route === 'admin') {
      this.gotoAdmin(path);
    } else if (route === 'scheduler') {
      this.gotoScheduler(path);
    }
    return cy.location('pathname').should('eq', fullPathName);
  }

  private gotoPlays(path: string[] = []) {
    const route = path.shift();
    if (route === 'new') {
      cy.get('a#add-my-play').click();
    }
  }

  private gotoScheduler(path: string[]) {
    const route = path.shift();
    if (route === 'new') {
      cy.get('a#new-schedule').click();
    }
  }

  private gotoAdmin(path: string[] = []) {
    cy.get('#account-widget .menu-trigger').click();
    cy.get('#user-menu button#admin').click();
    const route = path.shift();
    if (route === 'play') {
      this.gotoAdminPlay(path);
    } else if (route === 'tags') {
      this.gotoAdminTags(path);
    } else if (route === 'scheduler') {
      this.gotoAdminScheduler(path);
    }
  }

  private gotoAdminScheduler(path: string[]) {
    cy.get('#scheduler').click();
    const route = path.shift();
    if (route === 'staff') {
      this.gotoAdminSchedulerStaff(path);
    }
  }

  private gotoAdminSchedulerStaff(path: string[]) {
    cy.get('#staff').click();
    const route = path.shift();
    if (route === 'agent') {
      cy.get('#agent').click();
    }
  }

  private gotoAdminPlay(path: string[] = []) {
    cy.get('#play').click();
    const route = path.shift();
    if (route === 'tags') {
      cy.get('#tags').click();
    }
  }

  private gotoAdminTags(path: string[] = []) {
    cy.get('#tags').click();
    const route = path.shift();
    if (route === 'list') {
      cy.get('#list').click();
    }
  }
}