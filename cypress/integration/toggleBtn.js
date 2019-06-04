describe('Toggle Button', () => {
  beforeEach(() => {
    cy.visit('http://127.0.0.1:8080');

    cy.get('[data-main]:not([data-clone]) [data-toggle-btn]')
      .as('toggle-btn')

    cy.get('[data-main]:not([data-clone]) [data-overflow-nav]')
      .as('overflow-nav');

    cy.viewport(320, 660);
  });

  it('opens nav', () => {
    cy.get('@toggle-btn')
      .click();

    cy.get('@overflow-nav')
      .should('be.visible');
  });

  it('toggles nav', () => {

    cy.get('@toggle-btn')
      .click();

    cy.get('@overflow-nav')
      .should('be.visible');

    cy.get('@toggle-btn')
      .click();

    cy.get('@overflow-nav')
      .should('be.not.visible');
  });
});
