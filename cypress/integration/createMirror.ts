import createMirror from './../../src/utils/createMirror';

describe('createMirror', () => {
  beforeEach(() => {
    const keyArr = [
      { title: 'aa' },
      { title: 'ab' },
      { title: 'ac' },
    ];

    const mirrorArr = [
      { title: 'ba' },
      { title: 'bb' },
      { title: 'bc' },
    ];

    cy.wrap(keyArr)
      .as('keyArr')
      .wrap(mirrorArr)
      .as('mirrorArr');
  });

  describe('gets a Map mirror element', () => {
    it('from a -> b', function() {
      const { keyArr, mirrorArr } = this;
      const mirrorInstance = createMirror()(keyArr, mirrorArr);

      this.keyArr.forEach((_, index) => {
        const mirroredObj = mirrorInstance.get(keyArr[index]);
        expect(mirroredObj).to.equal(mirrorArr[index]);
      });
    });

    it('from b -> a', function() {
      const { keyArr, mirrorArr } = this;
      const mirrorInstance = createMirror()(this.mirrorArr, this.keyArr);

      this.keyArr.forEach((_, index) => {
        const mirroredObj = mirrorInstance.get(mirrorArr[index]);
        expect(mirroredObj).to.equal(keyArr[index]);
      });
    });
  });
});
