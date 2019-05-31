const expect = require('chai').expect;
const puppeteer = require('puppeteer');

describe('pplus', () => {
  let browser;
  let page;

  before(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage()

    await page.addScriptTag({ path: './dist/pplus.umd.js' });

    await page.evaluate(() => {
      const container = document.createElement('div');

      container.innerHTML = `
        <style>
          .p-plus--is-showing-overflow.p-plus--is-hiding-primary .p-plus__overflow {
            left: 0;
          }

          .p-plus__primary > li a {
            display: block;
            padding: 1em 2em;
            min-width: 6em;
            text-align: center;
          }

          .p-plus__primary {
            background-color: #212529;
          }

          .p-plus a {
            color: #fff;
          }

          .p-plus__primary > li:not(:first-child) {
            border-left: 1px solid #fff;
          }

          .p-plus__toggle-btn {
            padding: 1em;
            min-width: 6rem;
          }

          .p-plus__overflow {
            background: blue;
            padding: 2rem;
            margin: 0;
            min-width: 10em;
          }
        </style>
        <div class="container">
          <ul class="js-p-target">
            <li><a href="/">Home</a></li>
            <li><a href="/">About</a></li>
            <li><a href="/">Work</a></li>
            <li><a href="/">Services longer nav title</a></li>
            <li><a href="/">Contact</a></li>
          </ul>
        </div>
      `;

      document.body.appendChild(container);

      window.$instance = pplus(document.querySelector('.js-p-target'));
    });
  });

  after(async () => {
    await browser.close()
  });

  it('should create two navs', async () => {
    const { totalNavs, cloneCount } = await page.evaluate(() => {
      const navs = Array.from(document.querySelectorAll('.p-plus'));
      return {
        totalNavs: navs.length,
        cloneCount: navs.filter(nav => nav.classList.contains('p-plus--clone')).length,
      };
    });

    expect(totalNavs).to.equal(2);
    expect(cloneCount).to.equal(1);
  });
});
