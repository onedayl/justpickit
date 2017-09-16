let extendopupCard = null;
let advancedInfo = null;
let page = 0;
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
const match1 = /source=(\d+)/.exec(href);
const match2 = /skip=(\d+)/.exec(href);
const match3 = /limit=(\d+)/.exec(href);

let sourceId = match1 === null ? '0' : match1[1];
let skip = match2 === null ? '0' : match2[1];
let limit = match3 === null ? '10' : match3[1];

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
      callback: () => {
        httpRequest = new XMLHttpRequest();

        if (!httpRequest) {
          console.log('Error: Create xhr instance fails!');
          minirefresh.endUpLoading(true);

        } else {
          const url = `/list?source=${sourceId}&skip=${(page + 1) * limit}&limit=${limit}&format=json`;
          console.log(url);
          httpRequest.onreadystatechange = checkRefreshAndUpdate;
          httpRequest.open('GET', url);
          httpRequest.send();
        }
      }
    }
});

const cards = document.querySelectorAll('.card');
cards.forEach(card => card.addEventListener('click', showMore));

listContent= document.getElementById('content');
upwrap = listContent.lastChild;

const returnToHome = document.getElementById('returnHome');
returnToHome.addEventListener('click', () => {
  window.location.href = '/';
})

const footer = document.querySelector('.footer');

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
      const datas = JSON.parse(httpRequest.responseText);

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

        if (datas.length < limit) {
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
