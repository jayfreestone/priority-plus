Cypress.Commands.add('getNavItemsAs', (as, navSelector = '') => {
  cy
    .get(`[data-main]:not([data-clone]) ${navSelector} [data-nav-item]`)
    .invoke('toArray')
    .as(as);
});

Cypress.Commands.add('isOverflowing', () => (
  cy
    .get('[data-container]')
    .invoke('outerWidth')
    .then(containerWidth => (
      cy
        .get('[data-clone] [data-primary-nav]')
        .invoke('outerWidth')
        .then(cloneWidth => cloneWidth > containerWidth)
    ))
));

Cypress.Commands.add('getItemsAfterBreakpoint', (options) => {
  const {
    breakpoint = [1000, 660],
    as: {
      originalNavItems = 'originalItems',
      newOverflowItems = 'newOverflowItems',
      newPrimaryItems = 'newPrimaryItems',
    } = {},
  } = options;
  cy.getNavItemsAs(originalNavItems);
  cy.viewport(...breakpoint);

  // Required to 'wait' for mounting and library init
  cy.get('[data-toggle-btn]').should('exist');

  cy
    .isOverflowing()
    .then((isOverflowing) => {
      cy
        .get('[data-main]:not([data-clone]) [data-toggle-btn]')
        .should(isOverflowing ? 'be.visible' : 'not.be.visible');

      cy.getNavItemsAs(newPrimaryItems, '[data-primary-nav]');

      if (isOverflowing) {
        cy.getNavItemsAs(newOverflowItems, '[data-overflow-nav]');
      } else {
        cy.wrap([]).as(newOverflowItems);
      }
    });
});

describe('Nav items', () => {
  describe('are moved to the overflow', () => {
    it('at 768px', () => {
      cy.visit('http://127.0.0.1:8080');

      cy.getItemsAfterBreakpoint({
        breakpoint: [768, 660],
      });

      cy
      .then(function() {
        expect([...this.newPrimaryItems, ...this.newOverflowItems])
          .to.deep.equal([...this.originalItems]);
      });

    });

    it('at 320px', () => {
      cy.visit('http://127.0.0.1:8080');

      cy.getItemsAfterBreakpoint({
        breakpoint: [320, 660],
      });

      cy
      .then(function() {
        expect([...this.newPrimaryItems, ...this.newOverflowItems])
          .to.deep.equal([...this.originalItems]);
      });
    });
  });

  describe('are moved to the primary', () => {
    beforeEach(() => {
      cy.viewport(320, 660);
    });

    it('at 768px', () => {
      cy.visit('http://127.0.0.1:8080');

      cy.getItemsAfterBreakpoint({
        breakpoint: [768, 660],
      });

      cy
      .then(function() {
        expect([...this.newPrimaryItems, ...this.newOverflowItems])
          .to.deep.equal([...this.originalItems]);
      });
    });

    it('at 1000px', () => {
      cy.visit('http://127.0.0.1:8080');

      // cy
      //   .get('[data-clone] [data-primary-nav]')
      //   .invoke('outerWidth')
      //   .then(x => console.log(x));

      cy.getItemsAfterBreakpoint({
        breakpoint: [1000, 660],
      });

      cy
      .then(function() {
        expect([...this.newPrimaryItems, ...this.newOverflowItems])
          .to.deep.equal([...this.originalItems]);
      });
    });
  });
});
