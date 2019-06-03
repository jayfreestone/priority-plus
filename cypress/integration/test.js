describe('Nav items', () => {
  it('are successfully removed from the primary nav', async () => {
    cy.visit('http://127.0.0.1:8080');

    cy
    .get('[data-main]:not([data-clone]) [data-nav-item]')
    .invoke('toArray')
    .as('primaryNavItems');

    cy.viewport(768, 660);

    cy
    .get('[data-main]:not([data-clone]) [data-overflow-nav] [data-nav-item]')
    .invoke('toArray')
    .as('overflowNavItems');

    cy
    .get('[data-main]:not([data-clone]) [data-primary-nav] [data-nav-item]')
    .invoke('toArray')
    .as('newPrimaryNavItems');

    cy
    .then(function() {
      expect([...this.newPrimaryNavItems, ...this.overflowNavItems])
        .to.deep.equal([...this.primaryNavItems]);
    });
  });
});
