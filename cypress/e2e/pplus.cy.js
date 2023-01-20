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

      /**
       * We set up an event listener on the test page that will update the
       * document title once it runs, giving us something to listen to here
       * so we know when the first run has happened. If we set up a listener here
       * it is too late a percentage of the time (race condition).
       */

      const titleCallback = {
        title: 'Items Changed',
        event: 'itemsChanged',
      };

      cy.visit('/', {
        qs: { titleCB: JSON.stringify(titleCallback) },
      });
      registerContext();

      // First run has happened
    cy.title().should('eq', titleCallback.title)
      .get('@instance')
      // This only should run on post-first run itemsChanged events
      .invoke('on', 'itemsChanged', itemsChangedCB)
      // Viewport size change should alter items (change should be batched
      // into one event regardless of items changed).
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
      cy.visit('/', { qs: { showOverflow: true, } });
      registerContext();

      // We need this get to ensure we have fully initialized
      cy
        .get('@overflow-nav')
        .should('be.visible');

      cy.get('@instance')
        .invoke('on', 'hideOverflow', hideOverflowCB);

      cy.get('@toggle-btn')
        // Close
        .click()
        .then(() => {
          expect(hideOverflowCB).to.be.calledOnce;
        });
    });

    it('toggleClicked', () => {
      const toggleClickedCB = cy.spy();

      // Force overflow
      cy.viewport(320, 660);
      // Disable default behaviour (opening overflow)
      cy.visit('/', {
        qs: { openOnToggle: 'false' }
      })
      registerContext();

      cy
        .get('@instance')
        .invoke('on', 'toggleClicked', toggleClickedCB);

      cy.get('@toggle-btn')
        .click()
        // Confirm default behaviour doesn't occur
        .get('@overflow-nav')
        .should('not.be.visible')
        .then(() => {
          expect(toggleClickedCB).to.be.calledOnce;
        });
    });
  });
});


