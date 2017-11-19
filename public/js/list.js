let extendopupCard = null;
let advancedInfo = null;
let page = 2;
const sources = [
  "免费",
  "腾讯视频",
  "优酷视频",
  "爱奇艺视频",
  "搜狐视频",
  "乐视视频",
  "芒果 TV",
  "聚力视频"
];

const href = window.location.href;
const match1 = /title=(.*)/.exec(href);
const match2 = /is_free=(\d+)/.exec(href);
const match3 = /source=(\d+)/.exec(href);
const match4 = /sort=(\d+)/.exec(href);

let title = match1 == null ? '' : match1[1].trim();
let isFree = match2 == null ? '1' : match2[1];
let sourceId = match3 == null ? '1' : match3[1];
let sortId = match4 == null ? '1' : match4[1];

const miniRefresh = new MiniRefresh({
    container: '#minirefresh',
    down: {
      isLock: true,
      contentdown: '<(￣︶￣)> 再往下拉点',
      contentover: '=￣ω￣= 够了快松手',
      contentrefresh: '(๑•̀ㅂ•́)و 疯狂请求中',
      contentsuccess: '',
      contenterror: '(╯°□°）╯︵┻━┻ 请求出错了',
      successAnim: {
        isEnable: true,
        duration: 800
      },
      callback: () => {
        return true;
      }
    },
    up: {
      loadFull: {
        isEnable: false,
      },
      offset: 120,
      isAuto: false,
      toTop: {
        isEnable: false
      },
      callback: () => {
        httpRequest = new XMLHttpRequest();

        if (!httpRequest) {
          console.log('Error: Create xhr instance fails!');
          minirefresh.endUpLoading(true);

        } else {
          const url = `/list?is_free=${isFree}&source=${sourceId}&p=${page.toString()}&format=json`;
          httpRequest.onreadystatechange = checkRefreshAndUpdate;
          httpRequest.open('GET', url);
          httpRequest.send();
        }
      }
    }
});

const cards = document.querySelectorAll('.mycard');
cards.forEach(card => card.addEventListener('click', showMore));

listContent= document.getElementById('content');
upwrap = listContent.lastChild;
listContent.addEventListener('scroll', (e) => {
  const scrollHeight = listContent.scrollTop;
  if (scrollHeight > 600) {
    scrollTopBtn.classList.remove('invisible');
  } else if (scrollHeight < 400){
    scrollTopBtn.classList.add('invisible');
  }
})

// 返回首页点击事件
const returnToHome = document.getElementById('returnHome');
returnToHome.addEventListener('click', () => {
  window.location.href = '/';
})


// 回到页面顶部点击事件
const scrollTopBtn = document.getElementById('scrollTop');
scrollTopBtn.addEventListener('click', () => {
  miniRefresh.scrollTo(0, 300);
});


// 显示筛选弹出框点击事件
const filterBtn = document.getElementById('filter');
filterBtn.addEventListener('click', () => {
  filterModal.classList.remove('invisible');
});

const footer = document.querySelector('.footer');
const filterModal = document.getElementById('filter-modal');


// 隐藏筛选弹出框点击事件
const closeFilterBtn = document.getElementById('close-filter');
closeFilterBtn.addEventListener('click', () => {
  filterModal.classList.add('invisible');
});


// 应用筛选按钮点击事件
const applyFilterBtn = document.getElementById('apply-filter');
applyFilterBtn.addEventListener('click', () => {
  const title = document.getElementById('title').value;
  const is_free = document.getElementById('is_free').value;
  const source = document.getElementById('source').value;
  const sort = document.getElementById('sort').value;

  const url = `./list?title=${title}&is_free=${is_free}&source=${source}&sort=${sort}`;
  window.location.href = url;
});

function showMore() {
  extendCard = this;
  advancedInfo = this.querySelector('.advanced-info');
  advancedInfo.style.display = 'block';
}

function hideMore() {
  this.style.display = 'none';
}

function checkRefreshAndUpdate() {
  if (httpRequest.readyState === 4) {
    if (httpRequest.status === 200) {
      const datas = JSON.parse(httpRequest.responseText).data;

      if (datas.length !== 0) {
        datas.forEach((val, key) => {
          const flag = key % 2 ? 'even' : 'odd';
          const poster = val.images.small;
          const title = val.title;
          const genres = val.genres.map((v, k) => k === 0 ? v : ' / ' + v).join("");
          const year = val.year;
          const rating = val.rating;
          const summary = val.summary.split("\n").map(i => `<p>${i}</p>`).join("");
          const infos = val.playInfo.map(i => {
            return `<div class="source"><div class="icon icon${i.sourceId + 1}"></div><div class="name">${i.source}</div><div class="price">${i.price == -1 ? '¥ ?' : '¥ ' + i.price}</div></div>`
          }).join("");

          const ele = `<div class="basic-info"><div class="poster"><img src="${poster}"></div><div class="subject"><div class="title">${title}</div><div class="genres">${genres}</div><div class="year">${year}</div></div><div class="rating">${rating}</div></div><div class="advanced-info"><div class="summary">${summary}</div><div class="play-info">${infos}</div></div>`;

          const cardItem = document.createElement('div');
          cardItem.className = `card ${flag}`;
          cardItem.innerHTML = ele;
          cardItem.addEventListener('click', showMore)

          listContent.insertBefore(cardItem, upwrap);
        });

        if (datas.length < 5) {
          miniRefresh.endUpLoading(true);
        } else {
          miniRefresh.endUpLoading(false);
          page += 1;
        }

      } else {
        miniRefresh.endUpLoading(true);
      }
    }
  }
}
