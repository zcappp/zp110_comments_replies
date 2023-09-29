import React from "react"
import css from "../css/zp110_评论回复系统.css"

function render(ref) {
    const { exc, R, F } = ref
    if (!R) return <React.Fragment/>
    return <React.Fragment>
        <div>{R.count} 个评论
            {!F.start && !R.count && <button onClick={() => {ref.F={start: 1}; ref.render()}} className="zbtn zfright">评论</button>}
        </div>
        {F.start && rNewCmt(ref)}
        <ul>{R.arr.map(o => <li key={o._id}>
            {rUser(exc, o.auth, ref)}
            {rCmt(ref, o)}
            {(o.replyCnt || F.newReply === o._id) && rReply(ref, o)}
        </li>)}</ul>
        {R.count > R.arr.length && <span onClick={() => moreCmt(ref)} className="pmeta zfright">{EL.more}</span>}
        {!F.start && !!R.count && <button onClick={() => {ref.F={start: 1}; ref.render(); setTimeout(() => {$(".zp110 .zp100").scrollIntoView(); scrollBy(0, -100)}, 9)}} className="zbtn zfright">评论</button>}
    </React.Fragment>
}

function rNewCmt(ref) {
    return <div>
        {EL.write}
        <button onClick={() => {ref.F = {}; ref.render()}} className="zbtn">取消</button>
        <button onClick={() => newCmt(ref)} className="zbtn zprimary">发表</button>
    </div>
}

function rCmt(ref, o) {
    const { exc, render, F, admin } = ref
    if (F.cmt !== o._id) return <div>
        <div className="zarticle" dangerouslySetInnerHTML={{ __html: o.x.rt }}/>
        <div className="pmeta">
            <span>{exc(`timeago(date("${o._id}"))`)}</span>
            <div className="zfright">
                <span onClick={() => exc(`stopIf(${ref.like.includes(o._id)}, 'warn("不能重复点赞")'); $product.modify("${o._id}", {$inc: {"y.like": 1}})`, null, () => {ref.like.push(o._id); exc(`localStorage("zp110", v)`, {v: ref.like}); ref.render()})} className={"pmeta" + (ref.like.includes(o._id) ? " active" : "")}>{EL.like}{o.y.like || 0}</span>
                <span onClick={() => {ref.F = { newReply: o._id }; render()}} className="pmeta">{EL.replyCnt}{o.replyCnt}</span>
                {ref.user && (ref.user._id === o.auth || ref.user.role.includes(admin)) && <span onClick={() => {ref.F = {cmt: o._id}; render()}} className="pmeta">{EL.edit}</span>}
            </div>
        </div>
    </div>
    return <div>
        {render({ t: "Plugin", p: { ID: "zp100", P: { html: o.x.rt } } }, ref.id + "_1")}
        <button onClick={() => {ref.F = {}; render()}} className="zbtn">取消</button>
        <button onClick={() => delCmt(ref)} className="zbtn zdanger">删除</button>
        <button onClick={() => modifyCmt(ref)} className="zbtn zprimary">修改</button>
    </div>
}

function rReply(ref, o) {
    const { exc, render, F, admin } = ref
    return <div className="preplies">
        <ul>{o.reply.map(r => <li key={r.k}>
            {rUser(exc, r.auth, ref)}
            <span className="zfright pmeta">{exc(`timeago(date(${r.d}))`)}</span>
            {F.reply !== r.k && ref.user && (ref.user._id === r.auth || ref.user.role.includes(admin)) && <span onClick={() => {ref.F = {reply: r.k}; render()}} className="zfright pmeta">{EL.edit}</span>}
            {F.reply !== r.k ? <div className="zarticle" dangerouslySetInnerHTML={{ __html: r.rt }}/> : <div>
                {render({ t: "Plugin", p: { ID: "zp100", P: { html: r.rt } } }, ref.id + "_2")}
                <button onClick={() => {ref.F = {}; render()}} className="zbtn">取消</button>
                <button onClick={() => delReply(ref, o)} className="zbtn zdanger">删除</button>
                <button onClick={() => modifyReply(ref, o)} className="zbtn zprimary">修改</button>
            </div>}
        </li>)}</ul>
        {F.newReply === o._id ? <div>
            {EL.write}
            <button onClick={() => {ref.F = {}; render()}} className="zbtn">取消</button>
            <button onClick={() => newReply(ref, o)} className="zbtn zprimary">回复</button>
        </div> : <span onClick={() => {ref.F = { newReply: o._id }; render()}} className="zfright pmeta">{EL.reply}</span>}
        {!!o.replyM.length && <span onClick={() => {o.reply = o.reply.concat(o.replyM.splice(0, 5)); render()}} className="pmeta zfright">{EL.more}</span>}
    </div>
}

function rUser(exc, auth, ref) {
    let o = exc(`$c.user["${auth}"]`) || {}
    if (!o.x) o.x = {}
    let img = exc(`get(o, path)`, {o, path: ref.avatar}) || (o.wx ? o.wx.headimgurl : avatar) || avatar
    let name = exc(`get(o, path)`, {o, path: ref.username}) || (o.wx ? o.wx.nickname : "无名") || "无名"
    return <a href={ref.userpage ? exc(ref.userpage, o) : ""} target="_blank"><img className="pavatar" src={img}/><span>{name}</span></a>
}

function init(ref) {
    const { exc, render } = ref
    ref.F = {}
    ref.pid = ref.props.pid || exc('$id')
    ref.admin = ref.props.admin || "admin"
    ref.userpage = ref.props.userpage
    ref.username = ref.props.username || "x.姓名"
    ref.avatar = ref.props.avatar || "x.头像"
    if (!ref.pid) return exc('warn("请给插件zp110传入帖子_id")')
    EL.write = render({ t: "Plugin", p: { ID: "zp100" } }, ref.id + "_0")
    ref.container.start = () => {
        ref.F = { start: 1 };
        render()
    }
    getCmt(ref, R => {
        ref.user = exc('$c.me')
        ref.times = 0
        ref.pgid = exc('$pg') + exc('$id')
        ref.timer = setInterval(() => {
            ref.times += 1
            if (ref.times > 20 || ref.pgid != exc('$pg') + exc('$id')) clearInterval(ref.timer)
            getLatest(ref)
        }, 60000)
    })
    ref.like = exc('localStorage("zp110")') || []
}

function destroy(ref) {
    clearInterval(ref.timer)
}

function getCmt(ref, cb) {
    const _id = ref.pid
    ref.exc(`$product.search("zp110." + _id, Q, O, null, 1)`, { _id, Q: { type: "zp110", "x.zp110": _id }, O: { sort: { "_id": -1 }, limit: 10 } }, R => {
        if (!R) return warn("出错了")
        cb && cb(R)
        ref.R = R
        if (!R.count) return
        R.arr.forEach(a => transformReply(a))
        getUsers(ref, R.arr)
        ref.render()
    })
}

function moreCmt(ref) {
    const _id = ref.pid
    ref.exc(`$product.search("zp110." + _id, Q, O, null, 1)`, { _id, Q: { type: "zp110", "x.zp110": _id, _id: { $lt: ref.R.arr[ref.R.arr.length - 1]._id } }, O: { sort: { "_id": -1 }, limit: 10 } }, R => {
        if (!R || !R.count) {
            ref.R.count = ref.R.arr.length
            return wanr("no more cmt")
        }
        R.arr.forEach(a => transformReply(a))
        getUsers(ref, R.arr)
        ref.R.arr = ref.R.arr.concat(R.arr)
        ref.render()
    })
}

function getLatest(ref) {
    if (!ref.R || !ref.R.count) return getCmt(ref)
    const _id = ref.pid
    ref.exc(`$product.search("zp110." + _id, Q, O, null, 1)`, { _id, Q: { type: "zp110", "x.zp110": _id, _id: { $gt: ref.R.arr[0]._id } }, O: { limit: 0 } }, R => {
        if (!R || !R.count) return
        R.arr.sort((a, b) => a < b ? 1 : -1)
        R.arr.forEach(a => transformReply(a))
        ref.R.arr = R.arr.concat(ref.R.arr)
        ref.R.count += R.count
        getUsers(ref, R.arr)
        ref.render()
    })
}

function transformReply(o) {
    let reply = []
    if (o.x.reply) Object.keys(o.x.reply).forEach(k => {
        const arr = k.split("_")
        reply.push({ k, auth: arr[0], d: parseInt(arr[1]), rt: o.x.reply[k] })
    })

    o.replyCnt = reply.length
    o.reply = reply.splice(0, 5)
    o.replyM = reply
}

function getUsers(ref, arr) {
    const { exc } = ref
    let users = []
    arr.forEach(a => {
        if (!exc(`$c.user["${a.auth}"]`)) users.push(a.auth)
        if (Array.isArray(a.reply)) a.reply.forEach(a => {
            if (!exc(`$c.user["${a.auth}"]`)) users.push(a.auth)
        })
    })
    if (users.length) exc(`$user.search("zp110.user", Q, O)`, { Q: { _id: { $in: users.filter((v, i, a) => a.indexOf(v) === i) } }, O: { limit: 0, select: ref.username + " " + ref.avatar + " wx.nickname wx.headimgurl" } }, () => ref.render())
}

function newCmt(ref) {
    const { exc } = ref
    const rt = $(".zp110 .zp100").getHTML()
    if (!rt) return exc('warn("请填写评论内容")')
    const _id = ref.pid
    const exp = ref.props.api ? '$srv.zp110_new(x)' : '$product.create("zp110", x); $product.modify(_id, O)'
    exc(exp, { _id, x: { rt, zp110: _id }, O: { "$inc": { "y.cmt": 1 } } }, r => {
        if (!r) return warn("出错了")
        ref.F = {}
        exc('$c.product')[r._id] = r
        exc('render()')
        getLatest(ref)
    })
}

function delCmt(ref) {
    const { exc } = ref
    const _id = ref.F.cmt
    const exp = 'confirm("确定要删除吗?"); ' + (ref.props.api ? '$srv.zp110_del(X)' : '$product.modify(zp110, O); $product.delete(_id)')
    return exc(exp, { _id, X: { _id, zp110: ref.pid }, zp110: ref.pid, O: { "$inc": { "y.cmt": -1 } } }, r => {
        if (!r) return warn("出错了")
        const idx = ref.R.arr.findIndex(a => _id === a._id)
        if (idx > -1) ref.R.arr.splice(idx, 1)
        ref.R.count -= 1
        ref.F = {}
        exc('$c.product')[r._id] = r
        exc('render()')
    })
}

function modifyCmt(ref) {
    const rt = $(".zp110 .zp100").getHTML()
    if (!rt) return exc('warn("请填写评论内容")')
    ref.exc(`$product.modify("${ref.F.cmt}", O)`, { O: { rt } }, r => {
        ref.F = {}
        ref.render()
    })
}

function newReply(ref, o) {
    const { exc } = ref
    const rt = $(".zp110 .zp100").getHTML()
    if (!rt) return exc('warn("请填写回复内容")')
    if (!ref.user) return exc('warn("请登录")')
    const O = {
        ["x.reply." + ref.user._id + "_" + new Date().getTime()]: rt
    }
    exc(`$product.modify(o._id, O)`, { o, O }, r => {
        ref.F = {}
        transformReply(r)
        Object.assign(o, r)
        ref.render()
    })
}

function modifyReply(ref, cmt) {
    const rt = $(".zp110 .zp100").getHTML()
    if (!rt) return ref.exc('warn("请填写回复内容")')
    const O = {
        ["x.reply." + ref.F.reply]: rt
    }
    ref.exc(`$product.modify("${cmt._id}", O)`, { O }, r => {
        ref.F = {}
        transformReply(r)
        Object.assign(cmt, r)
        ref.render()
    })
}

function delReply(ref, cmt) {
    const O = {
        $unset: {
            ["x.reply." + ref.F.reply]: ""
        }
    }
    ref.exc(`confirm("确定要删除吗?"); $product.modify("${cmt._id}", O)`, { O }, r => {
        ref.F = {}
        transformReply(r)
        Object.assign(cmt, r)
        ref.render()
    })
}

$plugin({
    id: "zp110",
    props: [{
        prop: "pid",
        type: "text",
        label: "被评论对象_id",
        ph: "默认当前页面$id"
    }, {
        prop: "userpage",
        type: "text",
        label: "用户页表达式",
        ph: '默认是【"/user/" + _id】，不用括弧'
    }, {
        prop: "avatar",
        type: "text",
        label: "用户头像路径",
        ph: "默认是【x.头像】"
    }, {
        prop: "username",
        type: "text",
        label: "用户名称路径",
        ph: "默认是【x.姓名】"
    }, {
        prop: "admin",
        type: "text",
        label: "管理员role",
        ph: "默认是admin"
    }, {
        prop: "api",
        type: "switch",
        label: "使用自定义后端服务"
    }],
    render,
    init,
    destroy,
    css
})

const avatar = "//z.zccdn.cn/i/avatar_unkown.png"
const EL = {
    like: <svg className="zsvg" viewBox="0 0 1024 1024"><path d="M855.466667 362.666667H661.333333V164.266667C661.333333 108.8 616.533333 64 561.066667 64 512 64 469.333333 96 460.8 142.933333 435.2 281.6 354.133333 405.333333 256 405.333333H149.333333c-46.933333 0-85.333333 40.533333-85.333333 87.466667V853.333333c0 46.933333 38.4 85.333333 85.333333 85.333334h588.8c57.6 0 108.8-38.4 123.733334-93.866667l96-347.733333c19.2-68.266667-32-134.4-102.4-134.4zM256 454.4V896H149.333333c-23.466667 0-42.666667-19.2-42.666666-42.666667V492.8C106.666667 469.333333 125.866667 448 149.333333 448h106.666667v6.4z m661.333333 29.866667L821.333333 832c-10.666667 38.4-44.8 64-83.2 64H298.666667V443.733333c81.066667-23.466667 170.666667-117.333333 204.8-290.133333 4.266667-27.733333 27.733333-46.933333 57.6-46.933333C593.066667 106.666667 618.666667 132.266667 618.666667 164.266667v196.266666c0 23.466667 21.333333 44.8 44.8 44.8h192c19.2 0 38.4 8.533333 51.2 25.6 12.8 14.933333 14.933333 34.133333 10.666666 53.333334z"/></svg>,
    replyCnt: <svg className="zsvg" viewBox="0 0 1024 1024"><path d="M512 117.76c-225.28 0-409.6 161.28-409.6 358.4C102.4 588.8 161.28 691.2 256 755.2v181.76l179.2-110.08c25.6 5.12 51.2 7.68 76.8 7.68 225.28 0 409.6-161.28 409.6-358.4 0-199.68-184.32-358.4-409.6-358.4z m0 665.6c-30.72 0-58.88-2.56-87.04-10.24L304.64 844.8l2.56-117.76c-92.16-56.32-153.6-148.48-153.6-250.88 0-168.96 161.28-307.2 358.4-307.2s358.4 138.24 358.4 307.2-161.28 307.2-358.4 307.2z"/></svg>,
    edit: <svg className="zsvg" viewBox="0 0 1024 1024"><path d="M210.14 649.073l183.941 191.654L845.76 370.399 661.823 178.743 210.14 649.073M63.224 958.866L352.4 888.692 166.144 694.617 63.224 958.866m832.263-830.484c-52.8-55.023-99.91-92.062-152.711-37.044l-35.008 40.192 186.396 194.868 38.342-37.36c52.802-55.014 15.786-105.648-37.02-160.654l0.001-0.002m0 0z"/></svg>,
    reply: <svg className="zsvg" viewBox="0 0 1024 1024"><path d="M448 224c250.88 28.16 512 200 512 640-147.968-323.968-304-384-512-384V704L96 352 448 0v224z"/></svg>,
    more: <svg className="zsvg" viewBox="64 64 896 896"><path d="M533.2 492.3L277.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H188c-6.7 0-10.4 7.7-6.3 12.9L447.1 512 181.7 851.1A7.98 7.98 0 0 0 188 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5zm304 0L581.9 166.1c-3-3.9-7.7-6.1-12.6-6.1H492c-6.7 0-10.4 7.7-6.3 12.9L751.1 512 485.7 851.1A7.98 7.98 0 0 0 492 864h77.3c4.9 0 9.6-2.3 12.6-6.1l255.3-326.1c9.1-11.7 9.1-27.9 0-39.5z"/></svg>,
}