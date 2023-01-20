import {
  throwValidation,
  validateOptions,
  validateTarget,
} from './../../src/validation';

describe('validation', () => {
  describe('validateTarget', () => {
    it('should only accept HTMLElements', () => {
      expect(validateTarget('test')).to.have.lengthOf(2);
      expect(validateTarget({})).to.have.lengthOf(2);
      expect(validateTarget(document.createElement('div'))).to.have.lengthOf(1);
    });

    it('should only accept elements with children', () => {
      const parent = document.createElement('ul');
      parent.innerHTML = `
        <li>Item one</li>
        <li>Item two</li>
      `;

      expect(validateTarget(document.createElement('div'))).to.have.lengthOf(1);
      expect(validateTarget(parent)).to.be.empty;
    });
  });

  describe('validateOptions', () => {
    beforeEach(() => {
      const defaultOptions = { title: 'Mr', name: 'John Smith' };
      cy.wrap(defaultOptions).as('defaultOptions');
    });

    it('should not accept invalid option props', function() {
      const{ defaultOptions } = this;
      const withOneInvalid = { invalidProp: true };
      const withTwoInvalid = { invalidProp: true, secondProp: true };
      const withOneValidTwoInvalid = { title: 'Mr', invalidProp: true, secondProp: true };
      expect(validateOptions(withOneInvalid, defaultOptions)).to.have.lengthOf(1);
      expect(validateOptions(withTwoInvalid, defaultOptions)).to.have.lengthOf(2);
      expect(validateOptions(withOneValidTwoInvalid, defaultOptions)).to.have.lengthOf(2);
    });

    it('should accept valid option props', function() {
      const{ defaultOptions } = this;
      const withOneValid = { title: 'Mr' };
      const withAllValid = { title: 'Mr', name: 'John Smith' };
      expect(validateOptions(withOneValid, defaultOptions)).to.be.empty;
      expect(validateOptions(withAllValid, defaultOptions)).to.be.empty;
    });
  });

  describe('throwValidation', () => {
    it('should throw when errors are received', () => {
      expect(() => throwValidation(['Whoops'])).to.throw();
    });

    it('should do nothing if no errors are passed in', () => {
      expect(() => throwValidation()).to.not.throw();
      expect(() => throwValidation([])).to.not.throw();
    });
  });
});
