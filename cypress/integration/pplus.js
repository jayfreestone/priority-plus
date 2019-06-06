import priorityPlus from '../../dist/priority-plus.cjs';

function registerContext() {
  cy.window()
    .then(({ $inst }) => $inst)
    .as('instance');

  cy.get('[data-main]:not([data-clone]) [data-toggle-btn]')
    .as('toggle-btn');

  cy.get('[data-main]:not([data-clone]) [data-overflow-nav]')
    .as('overflow-nav');
}

describe('Events', () => {
  describe('fires', () => {
    it('itemsChanged', () => {
      const itemsChangedCB = cy.spy();

      cy.visit('/');
      registerContext();

      // We need this get to ensure we have fully initialized
      cy.get('@toggle-btn')
        .should('not.be.visible')
        .get('@instance')
        .invoke('on', 'itemsChanged', itemsChangedCB)
        // @todo: This is rubbish and should be re-thought.
        // I believe we need the wait as otherwise the event is fired before
        // the eventReady flag is set (i.e. before the first listener is
        // established).
        .wait(1)
        .viewport(320, 660)
        .get('@toggle-btn')
        .should('be.visible')
        .then(() => {
          expect(itemsChangedCB).to.be.calledOnce;
        });
    });

    it('showOverflow', () => {
      const showOverflowCB = cy.spy();

      cy.visit('/');
      registerContext();

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

      // Force overflow so we can see the dropdown
      cy.viewport(768, 660);
      // Show dropdown by default
      cy.visit('/?showOverflow=true');
      registerContext();

        // We need this get to ensure we have fully initialized
      cy.get('@overflow-nav')
        .should('be.visible')
        .get('@instance')
        .invoke('on', 'hideOverflow', hideOverflowCB)
        .get('@toggle-btn')
        // Close
        .click()
        .then(() => {
          expect(hideOverflowCB).to.be.calledOnce;
        });
    });
  });
});


