# 介绍

[Just Pick It](jpi.onedayl.com) 是初学 Node、Express、Pug 和 MongoDB 的练手项目，主要满足个人平时看电影的小需求：有选择的情况下不看盗版。

国内视频平台各自有一部分授权，而豆瓣上也可以在标记为「想看」的影片里筛选出可在线播放的，但体验不好的一点是列表上不显示播放源到底是哪个平台，这个信息是在影片详情页上，要一个个点进去才能看到，比较麻烦。

除了有些影片可以免费播放外，时不时我会购买某个平台的几个月的会员，如果在有效期内能集中看这个平台上的付费影片，性价比就会很高。

## 开发步骤

1. 抓取自己豆瓣上[标记想看的影片里可以在线播放的](https://movie.douban.com/people/ArabSquirrel/wish?sort=time&start=0&filter=video&mode=list)，这一步可以拿到影片 id。

2. 调用[豆瓣电影接口](https://developers.douban.com/wiki/?title=movie_v2#subject)获取除播放源信息之外的影片详情。

3. 利用影片 id 抓取[详情页](https://movie.douban.com/subject/25980443/)上的播放源信息。

4. 将所有影片信息存入数据库。

5. 编写接口和对应的前端页面，主要有 2 个：
  - 首页，列出免费以及各平台付费的影片数量
  - 列表页，根据首页各项的筛选条件列出影片信息，其中简介和播放源在点击卡片后才显示。

## 项目截图
首页|列表页|列表页-展开
----|----|----
![首页](http://osx6ik13d.bkt.clouddn.com/jpi_1.jpg)|![列表页](http://osx6ik13d.bkt.clouddn.com/jpi_2.jpg)|![列表页-展开](http://osx6ik13d.bkt.clouddn.com/jpi_3.jpg)
