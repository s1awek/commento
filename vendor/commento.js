serialize = function(obj) {
    var str = [];
    for(var p in obj)
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    return str.join("&");
}

function post(url, data, callback) {
    var xmlDoc = new XMLHttpRequest();
    xmlDoc.open('POST', url, true);
    xmlDoc.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xmlDoc.onreadystatechange = function() {
        if (xmlDoc.readyState === 4 && xmlDoc.status === 200)
            callback(xmlDoc);
    }
    xmlDoc.send(serialize(data));
}

post_root = function() {
    document.getElementById("root_comment").classList.remove("is-error");
    document.getElementById("root_name").classList.remove("is-error");
    if(document.getElementById("root_comment").value.length == 0) {
        document.getElementById("root_comment").classList.add("is-error");
        return;
    }
    if(document.getElementById("root_name").value.length == 0) {
        document.getElementById("root_name").classList.add("is-error");
        return;
    }
    data = {
        "url": document.location,
        "comment": document.getElementById("root_comment").value,
        "name": document.getElementById("root_name").value,
        "parent": -1
    };
    post(COMMENTO_SERVER + "/create", data, function(reply) {
        reply = JSON.parse(reply.response);
        document.getElementById("root_comment").value = "";
        getcomments();
    })
}

getcomments = function() {
    data = {
        "url": document.location,
    };
    post(COMMENTO_SERVER + "/get", data, function(reply) {
        reply = JSON.parse(reply.response);
        comments = reply.comments;
        redraw();
    })
}

submit_reply = function(id) {
    document.getElementById("reply_textarea_"+id).classList.remove("is-error");
    document.getElementById("name_input_"+id).classList.remove("is-error");
    if(document.getElementById("reply_textarea_"+id).value.length == 0) {
        document.getElementById("reply_textarea_"+id).classList.add("is-error");
        return;
    }
    if(document.getElementById("name_input_"+id).value.length == 0) {
        document.getElementById("name_input_"+id).classList.add("is-error");
        return;
    }
    data = {
        "comment": document.getElementById("reply_textarea_"+ id).value,
        "name": document.getElementById("name_input_"+ id).value,
        "parent": id,
        "url": document.location,
    };
    post(COMMENTO_SERVER + "/create", data, function(reply) {
        reply = JSON.parse(reply.response);
        getcomments();
    })
}

cancel_reply = function(id) {
    document.getElementById("reply_textarea_" + id).remove();
    document.getElementById("submit_button_" + id).remove();
    document.getElementById("cancel_button_" + id).remove();
    document.getElementById("name_input_" + id).remove();
    document.getElementById("reply_button_" + id).setAttribute("style", "display: initial");
}

show_reply = function(id) {
    var button = document.getElementById("reply_button_" + id);
    button.setAttribute("style", "display: none");

    var body = document.getElementById("body_" + id);

    var textarea = document.createElement("textarea");
    textarea.classList.add("form-input");
    textarea.id = "reply_textarea_" + id;
    body.appendChild(textarea);

    var name = document.createElement("input");
    name.classList.add("form-input");
    name.setAttribute("placeholder", "Name");
    name.setAttribute("style", "margin: 1px; width: 33%;");
    name.id = "name_input_" + id;

    var cancel = document.createElement("button");
    cancel.innerHTML = "Cancel";
    cancel.classList.add("btn");
    cancel.setAttribute("onclick", "cancel_reply(" + id + ")");
    cancel.setAttribute("style", "margin: 1px; width: 33%;");
    cancel.id = "cancel_button_" + id;

    var submit = document.createElement("button");
    submit.innerHTML = "Reply";
    submit.classList.add("btn");
    submit.classList.add("btn-primary");
    submit.setAttribute("onclick", "submit_reply(" + id + ")");
    submit.setAttribute("style", "margin: 1px; width: 33%;");
    submit.id = "submit_button_" + id;

    var button_holder = document.createElement("div");
    button_holder.classList.add("button-holder");
    button_holder.setAttribute("style", "display: flex; width: 100%; margin: 2px;");
    button_holder.appendChild(name);
    button_holder.appendChild(cancel);
    button_holder.appendChild(submit);

    body.appendChild(button_holder);
}

function timeDifference(current, previous) { // thanks stackoverflow
    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';   
    }
    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }
    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }
    else if (elapsed < msPerMonth) {
        return 'approximately ' + Math.round(elapsed/msPerDay) + ' days ago';   
    }
    else if (elapsed < msPerYear) {
        return 'approximately ' + Math.round(elapsed/msPerMonth) + ' months ago';   
    }
    else {
        return 'approximately ' + Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}

make_cards = function(coms, cur) {
    if(!(cur in coms) || coms[cur].length == 0)
        return null;

    var cards = document.createElement("div");
    for(var i = 0; i < coms[cur].length; i++) {
        var card = document.createElement("div");
        card.classList.add("card");

        var title = document.createElement("div");
        title.classList.add("card-header");

        var h5 = document.createElement("h5");
        h5.innerHTML = coms[cur][i].name;

        var subtitle = document.createElement("div");
        subtitle.classList.add("card-subtitle");
        subtitle.innerHTML = timeDifference(Date.now(), Date.parse(coms[cur][i].timestamp));
        subtitle.setAttribute("style", "margin-left: 15px;");
        title.appendChild(h5);
        title.appendChild(subtitle);
        card.appendChild(title);

        var body = document.createElement("div");
        body.id = "body_" + coms[cur][i].id;
        body.classList.add("card-body");
        body.innerHTML = converter.makeHtml(coms[cur][i].comment);
        var res = make_cards(coms, coms[cur][i].id);
        card.appendChild(body);

        var footer = document.createElement("div");
        footer.classList.add("card-header");
        var button = document.createElement("button");
        button.id = "reply_button_" + coms[cur][i].id;
        button.classList.add("btn");
        button.innerHTML = "Reply";
        button.setAttribute("onclick", "show_reply(" + coms[cur][i].id + ")")
        footer.appendChild(button);

        card.appendChild(footer);
        if(res != null) {
            res.classList.add("card-body");
            card.appendChild(res);
        }
        cards.appendChild(card);
    }

    return cards;
}

redraw = function() {
    document.getElementById("coms").innerHTML = "";
    coms = {}
    for(var i = 0; i < comments.length; i++) {
        if(!(comments[i].parent in coms))
            coms[comments[i].parent] = new Array();
        coms[comments[i].parent].push(comments[i]);
    }

    cards = make_cards(coms, -1);
    if(cards != null)
        document.getElementById("coms").append(cards)
}

function loadJS(file, callback) {
    var script = document.createElement("script");
    script.type = "application/javascript";
    script.src = file;
    loaded = false;
    script.onreadystatechange = script.onload = function() {
        if(!loaded)
            callback();
        loaded = true;
    }
    document.body.appendChild(script);
}

function loadCSS(file) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.setAttribute("href", file);
    link.setAttribute("rel", "stylesheet");
    document.body.appendChild(link);
}

init_commento = function(server) {
    COMMENTO_SERVER = server;
    loadJS("https://cdn.rawgit.com/showdownjs/showdown/1.6.3/dist/showdown.min.js", function() {
        loadCSS("https://cdn.rawgit.com/picturepan2/spectre/master/docs/dist/spectre.min.css");
        loadCSS("https://cdn.rawgit.com/adtac/commento/0.1.2/vendor/commento.min.css");
        converter = new showdown.Converter();

        var commento = document.getElementById("commento");

        var div = document.createElement("div");
        div.classList.add("commento-comments");

        var textarea = document.createElement("textarea");
        textarea.setAttribute("id", "root_comment");
        textarea.classList.add("form-input");

        var sub_area  = document.createElement("div");
        sub_area.classList.add("submit_area");

        var input = document.createElement("input");
        input.classList.add("form-input");
        input.classList.add("root-elem");
        input.id = "root_name";
        input.setAttribute("placeholder", "Name");

        var button = document.createElement("button");
        button.innerHTML = "Post comment";
        button.classList.add("root-elem");
        button.classList.add("btn");
        button.classList.add("btn-primary");
        button.setAttribute("onclick", "post_root()");

        var comselem = document.createElement("div");
        comselem.id = "coms";

        sub_area.appendChild(input);
        sub_area.appendChild(button);
        div.appendChild(textarea);
        div.appendChild(sub_area);
        div.appendChild(comselem);
        commento.appendChild(div);

        getcomments();
    });
}
