const easyvk = require("easyvk")
const opt = {token: "0c883b69440cec7864ea357fad65241add714038c965e57aca45210b198acd2a07a53877408c5d3178f60"};
easyvk(opt).then(async vk => {
    const com = await vk.call("wall.getComments", {
        owner_id: -187263168,
        post_id: 490759,
        count: 100
    });
    const comments = com.items.map(el => {
        if(el.text) {
            return el.text
        }
    });
    console.log("{" + comments.toString().replace(/,/ig, "|") + "}")
});