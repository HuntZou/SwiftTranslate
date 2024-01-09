
// 接口最大翻译长度为20
function translate(q, from, to) {
	if (q.trim().length) document.getElementById("result").innerHTML = "..."
	else return
	if (q.trim().length > 20) {
		document.getElementById("result").innerHTML = "待翻译文本超出翻译最大长度20";
		return;
	}
	
	// 您需要自己去有道翻译官网申请一个应用，再在这里填写你自己的appkey和密钥 https://ai.youdao.com/console/#/app-overview
	var appKey = '21c93244dd87c2ff';
	var key = 'tbaSoxrq0daNZ*OqTJJO5w0g2BxMSe*y';  // 给自己说的： 分别将两个 * 替换为我名字首字母大写
	var salt = (new Date).getTime();
	var curtime = Math.round(new Date().getTime()/1000);
	var query = q;
	// 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
	var str1 = appKey + query + salt + curtime + key;

	var sign = CryptoJS.SHA256(str1).toString(CryptoJS.enc.Hex);

	req = `q=${query}&appKey=${appKey}&salt=${salt}&from=${from}&to=${to}&sign=${sign}&signType=v3&curtime=${curtime}`
	
	fetch('https://openapi.youdao.com/api', {
		method: 'post',
		body: req,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		}
	}).then(r => r.json()).then(resp => {
		console.log(resp)
		if (resp.errorCode == "0") {
			if (resp.basic) {
				// 显示读音
				if (resp?.basic['us-phonetic']) {
					document.getElementById('phonetic').innerHTML = resp?.basic['us-phonetic']
					document.getElementById('voice').style.display = "block"
				} else if (resp?.basic['phonetic']) {
					document.getElementById('phonetic').innerHTML = resp?.basic['phonetic']
					document.getElementById('voice').style.display = "block"
				} else {
					document.getElementById('phonetic').innerHTML = ""
					document.getElementById('voice').style.display = "none"
				}
				
				// 是否存在可播放读音
				if (resp?.basic['us-speech']) {
					document.getElementById("audio").src = resp?.basic['us-speech']
					document.getElementById('btn_voice').style.display = "inline-block"
				} else {
					document.getElementById("audio").src = ""
					document.getElementById('btn_voice').style.display ="none"
				}
				
				let explains = (resp?.basic?.explains || []).map(e => "<div><span style='color:red;font-weight:800'>></span> " + e.trim() + "</div>").join("")
				document.getElementById("result").innerHTML = explains
			} else if (resp.translation) {
				let explains = (resp?.translation || []).map(e => "<div><span style='color:red;font-weight:800'>></span> " + e.trim() + "</div>").join("")
				document.getElementById("result").innerHTML = explains
			} else {
				document.getElementById('voice').style.display = "none"
				document.getElementById("result").innerHTML = "!!! 无译文 No translation"
			}
		}
		else {
			document.getElementById('voice').style.display = "none"
			document.getElementById("result").innerHTML = "ERROR: " + resp.errorCode
		}
	})
}

function play_voice() {
	document.getElementById('audio').play()
}

function en2zh() {
	q = document.getElementById("origin_input").value
	if (q?.trim().length) translate(q.trim(), "en", "zh-CHS")
	else document.getElementById("result").innerHTML = "输入不能为空 NULL INPUT"
}

function zh2en() {
	q = document.getElementById("origin_input").value
	if (q?.trim().length) translate(q.trim(), "zh-CHS", "en")
	else document.getElementById("result").innerHTML = "输入不能为空 NULL INPUT"
}

// 自动获取当前选中的文本进行翻译
chrome.tabs.query({active: true, currentWindow: true}).then(tabs => {
	tab = tabs?.at(0);
	if (!tab) return;
	if (/^(chrome|edge).*/.test(tab.url)) return
	chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => getSelection().toString(),
    }).then(texts => {
		if (!texts?.at(0)?.result?.trim()?.length) return;
		selected = texts[0].result.trim();
		document.getElementById("origin_input").value = selected;
		translate(selected, "en", "zh-CHS")
	})
})

// 为按钮绑定 onclick 事件
document.addEventListener('DOMContentLoaded', function() {
    var btn_en2zh = document.getElementById('btn_en2zh');
    btn_en2zh.addEventListener('click', en2zh);


    var btn_zh2en = document.getElementById('btn_zh2en');
    btn_zh2en.addEventListener('click', zh2en);
	
    var btn_voice = document.getElementById('btn_voice');
    btn_voice.addEventListener('click', play_voice);
	
	// 屏蔽 textarea 的回车按键，当按下回车时进行翻译
	var origin_input = document.getElementById('origin_input');
	origin_input.addEventListener("keydown", function(event) {
		if (event.which === 13) {
			event.preventDefault();
			if (!event.repeat) {
				let q = document.getElementById("origin_input").value
				let regExp = /^[a-zA-Z]+.*$/i;  // 默认以英文开头就是英译汉
				if (!regExp.test(q)) zh2en()
				else en2zh()
			}
		}
	});
});