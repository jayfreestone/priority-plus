import priorityPlus from '../../dist/priority-plus.cjs';

describe('Events', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window()
      .then(({ $inst }) => $inst)
      .as('instance');

    cy.get('[data-main]:not([data-clone]) [data-toggle-btn]')
      .as('toggle-btn');

    cy.get('[data-main]:not([data-clone]) [data-overflow-nav]')
      .as('overflow-nav');
  });

  describe('fires', () => {
    // it('itemsChanged', () => {
    //   const itemsChangedCB = cy.spy();

    //     // We need this get to ensure we have fully initialized
    //   cy.get('@toggle-btn')
    //     .should('not.be.visible')
    //     .get('@instance')
    //     .invoke('on', 'itemsChanged', itemsChangedCB)
    //     .viewport(768, 660)
    //     .get('@toggle-btn')
    //     .should('be.visible')
    //     .then(() => {
    //       expect(itemsChangedCB).to.be.calledOnce;
    //     });
    // });

    it('showOverflow', () => {
      const showOverflowCB = cy.spy();

      cy.get('@instance')
        .invoke('on', 'showOverflow', showOverflowCB)
        .viewport(768, 660)
        .get('@toggle-btn')
        .should('be.visible')
        .click()
        .then(() => {
          expect(showOverflowCB).to.be.calledOnce;
        });
    });

    it('hideOverflow', () => {
      const hideOverflowCB = cy.spy();

      cy.viewport(768, 660)
        // We need this get to ensure we have fully initialized
        .get('@toggle-btn')
        .should('be.visible')
        .get('@instance')
        .invoke('on', 'hideOverflow', hideOverflowCB)
        .get('@toggle-btn')
        // Open
        .click()
        // Close
        .click()
        .then(() => {
          expect(hideOverflowCB).to.be.calledOnce;
        });
    });
  });
});


