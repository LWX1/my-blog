module.exports = {
	title: "lwx",
	description: "lwx",
	dest: "public",
	host: "127.0.0.1",
	port: "7780",
	head: [
		[
			"link",
			{
				rel: "icon",
				href: "/img/favicon.ico",
			},
		],
		[
			"meta",
			{
				name: "viewport",
				content: "width=device-width,initial-scale=1,user-scalable=no",
			},
		],
	],
	theme: "reco",
	themeConfig: {
		subSidebar: "auto",
		nav: [
			{
				text: "首页",
				link: "/",
				icon: "reco-home",
			},
			{
				text: "时间",
				link: "/timeline/",
				icon: "reco-date",
			},
			{
				text: "文档",
				icon: "reco-blog",
				items: [
					{
						text: "react",
						link: "/docs/react/",
					},
					{
						text: "vue",
						link: "/docs/vue/",
					},
					{
						text: "webpack",
						link: "/docs/webpack/",
					},
					{
						text: "typescript",
						link: "/docs/typescript/",
					},
					{
						text: "three.js",
						link: "/docs/three/",
					},
					{
						text: "canvas",
						link: "/docs/canvas/",
					},
					{
						text: "性能分析优化",
						link: "/docs/performance/",
					},
				],
			},
			{
				text: "项目",
				icon: "reco-document",
				items: [
					{
						text: "文档在线预览",
						link: "http://niubiplus.buzz/fileViewer",
					},
					
				],
			},
			{
				text: "链接",
				icon: "reco-message",
				items: [
					{
						text: "GitHub",
						link: "https://github.com/LWX1",
						icon: "reco-github",
					},
				],
			},
		],
		sidebar: {
			"/docs/react/": [
				"event_事件绑定",
				"component_捕获错误",
				"组件通讯",
				"diff",
				"fiber",
				"生命周期",
				"hooks",
			],
			"/docs/vue/": ["communicate", "diff"],
			"/docs/webpack/": ["base", "loader", "plugin", "optimization"],
			"/docs/three/": ["introduce", "plugin"],
			"/docs/canvas/": ["boll"],
			"/docs/typescript/": ["type", "highType", "type和interface"],
			"/docs/performance/": ["指标分析", "指标优化"],
		},
		type: "blog",
		blogConfig: {
			category: {
				location: 2,
				text: "分类",
			},
			tag: {
				location: 3,
				text: "标签",
			},
		},
		friendLink: [
			{
				title: "忆回",
				desc: "梦开始的地方",
				email: "1722844165@qq.com",
				link: "https://www.linwenx.cn:8001",
			},
			// {
			//   "title": "vuepress-theme-reco",
			//   "desc": "A simple and beautiful vuepress Blog & Doc theme.",
			//   "avatar": "https://vuepress-theme-reco.recoluan.com/icon_vuepress_reco.png",
			//   "link": "https://vuepress-theme-reco.recoluan.com"
			// }
		],
		logo: "/img/logo.png",
		search: false,
		searchMaxSuggestions: 10,
		lastUpdated: "Last Updated",
		author: "lwx",
		authorAvatar: "/img/avatar.png",
		record: "努力",
		startYear: "2021",
	},
	markdown: {
		lineNumbers: true,
	},
	plugins: [
		[
			"sitemap",
			{
				hostname: "http://www.linwenx.cn:8001",
			},
		],
		"vuepress-plugin-baidu-autopush",
		[
			require("./plugins/player/index"),
			{
				audios: [
					// 本地文件示例
					// {
					//   name: '장가갈 수 있을까',
					//   artist: '咖啡少年',
					//   url: '/bgm/1.mp3',
					//   cover: '/bgm/1.jpg'
					// },
					// 网络文件示例
					{
						name: "平凡之路",
						artist: "朴树",
						url: "/audio/平凡之路.m4a",
						cover: "http://p2.music.126.net/IwEI0tFPh4w9OjY6RM2IJQ==/109951163009071893.jpg?param=130y130",
					},
					{
						name: "像我这样的人",
						artist: "毛不易",
						url: "/audio/像我这样的人.m4a",
						cover: "http://p2.music.126.net/vmCcDvD1H04e9gm97xsCqg==/109951163350929740.jpg?param=130y130",
					},
					{
						name: "桥边姑娘",
						artist: "海伦",
						url: "https://ws.stream.qqmusic.qq.com/C400001zLvbN1NYMuv.m4a?guid=4016550060&vkey=43B591906B96AB53C98B8CBBA5DB395EAD6DFC5D2AC5DF915801ECA9C7F7EF5172B35D07A0C0E1C1B1FB2993DBA3ABDDD4A6B1775769454C&uin=1722844165&fromtag=66",
						cover: "http://p1.music.126.net/vj6NqgCZuY4nGW_Lqn0yLQ==/109951164525796063.jpg?param=177y177",
					},
					{
						name: "董小姐",
						artist: "海伦",
						url: "https://isure.stream.qqmusic.qq.com/C400001w25Mm4JwLgT.m4a?guid=4016550060&vkey=7B7019F28F0235957E2CB2BBCF7A540512F035D4A9942E0849EC0078D45E8B4B77308B48FF08BA0E9E431DFAC9F483E6F859201E784A45B5&uin=1722844165&fromtag=66",
						cover: "https://y.gtimg.cn/music/photo_new/T001R150x150M000004KKLWZ4320g1.jpg?max_age=2592000",
					},
					{
						name: "外面的世界",
						artist: "齐秦",
						url: "https://ws.stream.qqmusic.qq.com/C400002iyJAI3jAMUT.m4a?guid=4016550060&vkey=377FC278007FB4E4CA7C77046653A2E99945685FA081E66EE65CC21BB41699832F4E0B0A398B0A1EF5C96C4D539701C92F082F6CB7053385&uin=1722844165&fromtag=66",
						cover: "https://y.gtimg.cn/music/photo_new/T002R300x300M000003e5uS93rdNDL.jpg?max_age=2592000",
					},
				],
				autoShrink: true,
				autoplay: true,
				shrinkMode: "mini",
			},
		],
		[
			"vuepress-plugin-helper-live2d",
			{
				// 是否开启控制台日志打印(default: false)
				log: false,
				live2d: {
					// 是否启用(关闭请设置为false)(default: true)
					enable: true,
					// 模型名称(default: hibiki)>>>取值请参考：
					// https://github.com/JoeyBling/hexo-theme-yilia-plus/wiki/live2d%E6%A8%A1%E5%9E%8B%E5%8C%85%E5%B1%95%E7%A4%BA
					model: "koharu",
					display: {
						position: "right", // 显示位置：left/right(default: 'right')
						width: 135, // 模型的长度(default: 135)
						height: 300, // 模型的高度(default: 300)
						hOffset: 65, //  水平偏移(default: 65)
						vOffset: 0, //  垂直偏移(default: 0)
					},
					mobile: {
						show: false, // 是否在移动设备上显示(default: false)
					},
					react: {
						opacity: 0.8, // 模型透明度(default: 0.8)
					},
				},
			},
		],

		[
			"sakura",
			{
				num: 20, // 默认数量
				show: true, //  是否显示
				zIndex: 2, // 层级
				img: {
					replace: false, // false 默认图 true 换图 需要填写httpUrl地址
					httpUrl: "/img/yh.png", // 绝对路径
				},
			},
		],
		// [
		//   '@vssue/vuepress-plugin-vssue', {
		//     // 设置 `platform` 而不是 `api`
		//     platform: 'github',
		//     locale: 'zh', //语言
		//     // 其他的 Vssue 配置
		//     owner: 'LWX1',
		//     repo: 'my-blog',
		//     clientId: 'b6a4f7588abe3db6ea0f',
		//     clientSecret: '3929461a8af15c5a15df5547fe809a4549335593',
		//     autoCreateIssue: true
		//   },

		// ]
		["cursor-effects"],
	],
};
