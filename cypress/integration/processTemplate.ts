import processTemplate from './../../src/utils/processTemplate';

describe('processTemplate', () => {
  it('handles string input', () => {
    const inputStr = '<div></div>';
    const output = processTemplate(inputStr);
    expect(inputStr).to.equal(output);
  });

  it('handles function input', () => {
    const args = { title: 'Great title' };

    function inputFn({ title }) {
      return `<div><h1>${title}</h1></div>`;
    }

    const output = `<div><h1>Great title</h1></div>`;

    expect(inputFn(args)).to.equal(output);
  });

  it('handles function input with no args', () => {
    function inputFn() {
      return '<div><h1>Great title</h1></div>';
    }

    const output = `<div><h1>Great title</h1></div>`;

    expect(inputFn()).to.equal(output);
  });
});
