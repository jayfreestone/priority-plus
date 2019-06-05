describe('Nav items', () => {
  function isOverflowing() {
    return () => (
      cy.get('[data-container]')
        .invoke('outerWidth')
        .then(containerWidth => (
          cy
            .get('[data-clone] [data-primary-nav]')
            .invoke('outerWidth')
            .then(cloneWidth => cloneWidth > containerWidth)
        ))
    );
  }

  function expectOriginalComparison() {
    return function({ newPrimaryItems = [], newOverflowItems = [], originalItems = [] }) {
      expect([...newPrimaryItems, ...newOverflowItems])
        .to.deep.equal([...originalItems]);
    };
  }

  function getNavItemsAs(as, navSelector = '') {
    return () => (
      cy.get(`[data-main]:not([data-clone]) ${navSelector} [data-nav-item]`)
        .invoke('toArray')
        .as(as)
    );
  }

  function getItemsAfterBreakpoint(options) {
    return () => {
      const {
        breakpoint = 1000,
        as: {
          originalItems = 'originalItems',
          newOverflowItems = 'newOverflowItems',
          newPrimaryItems = 'newPrimaryItems',
        } = {},
      } = options;
      cy.then(getNavItemsAs(originalItems));
      cy.viewport(breakpoint, Cypress.config('viewportHeight'));

      return cy
        .then(isOverflowing())
        .then((overflowing) => {
          cy.get('@toggle-btn')
            .should(overflowing ? 'be.visible' : 'not.be.visible')
            .then(getNavItemsAs(newPrimaryItems, '[data-primary-nav]'));

          if (overflowing) {
            cy.then(getNavItemsAs(newOverflowItems, '[data-overflow-nav]'));
          } else {
            cy.wrap([]).as(newOverflowItems);
          }

          return cy.then(function() {
            return {
              originalItems: this.originalItems,
              newPrimaryItems: this.newPrimaryItems,
              newOverflowItems: this.newOverflowItems
            };
          });
        });
    };
  }

  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080');
    cy.get('[data-main]:not([data-clone]) [data-toggle-btn]')
      .as('toggle-btn');
  });

  describe('are moved to the overflow nav', () => {
    it('at 768px', () => {
      cy.then(getItemsAfterBreakpoint({ breakpoint: 768 }))
        .then(expectOriginalComparison());
    });

    it('at 320px', () => {
      cy.then(getItemsAfterBreakpoint({ breakpoint: 320 }))
        .then(expectOriginalComparison());
    });
  });

  describe('are moved to the primary nav', () => {
    beforeEach(() => {
      cy.viewport(320, 660);
    });

    it('at 768px', () => {
      cy.then(getItemsAfterBreakpoint({ breakpoint: 768 }))
        .then(expectOriginalComparison());
    });

    it('at 1000px', () => {
      cy.then(getItemsAfterBreakpoint({ breakpoint: 1000 }))
        .then(expectOriginalComparison());
    });
  });
});
