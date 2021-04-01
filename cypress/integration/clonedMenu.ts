import priorityPlus from '../../src/priorityPlus';

describe('Cloned menu', () => {
  it('should preserve the original menu\'s attributes', () => {
    const original = document.createRange().createContextualFragment(`
      <nav>
        <ul class="menu-items test" data-depth="1" data-test>
            <li class="menu-items__item menu-items__item_article menu-items__item_active" data-custom>
              <a href="#">
                Item One
              </a>
            </li>
        </ul>
      </nav>
   `);

    const [menu, items] = getMenuElements(original);

    priorityPlus(menu);

    const [instanceMenu, instanceItems] = getMenuElements(original);

    assertEnhancedContainsAttributes(menu, instanceMenu);
    assertEnhancedContainsClasses(menu, instanceMenu);

    items.forEach((item, i) => {
      assertEnhancedContainsAttributes(item, instanceItems[i]);
      assertEnhancedContainsClasses(item, instanceItems[i]);
    });
  });
});

function getMenuElements(elem: DocumentFragment): [HTMLElement, HTMLLIElement[]] {
  const menu = elem.querySelector('ul') as HTMLElement;
  const items = Array.from(elem.querySelectorAll('li')) as HTMLLIElement[];
  return [menu, items];
}

// Assert that each class on the original element is present on the copy.
function assertEnhancedContainsClasses(original: HTMLElement, enhanced: HTMLElement) {
  Array.from(original.classList).forEach(className => {
    expect(Array.from(enhanced.classList), 'class').to.contain(className)
  });
}

// Assert that every easily comparable attribute (e.g. not class) on the
// original is present on the copy.
function assertEnhancedContainsAttributes(original: HTMLElement, enhanced: HTMLElement) {
  const [originalAttrs, enhancedAttrs] = [original, enhanced]
    .map(getAttributes)
    .map(retainComparable);
  const originalDict = Object.fromEntries(originalAttrs);

  // Filter out attributes added by priorityPlus.
  const preserved = enhancedAttrs.filter(([key]) => key in originalDict);

  expect(preserved, 'attributes').to.deep.equal(originalAttrs);
}

// Filter out hard to compare attributes.
function retainComparable(attrList: string[][]) {
  return attrList.filter(([name]) => name !== 'class');
}

function getAttributes(elem: HTMLElement) {
  return Object.keys(elem.attributes).map(key => {
    const attr = elem.attributes[Number(key)] as Attr;
    return [attr.name, attr.value];
  });
}

