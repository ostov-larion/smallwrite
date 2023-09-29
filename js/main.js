let feed = document.querySelector("#feed");
let editor = document.querySelector("#editor");
let reader = document.querySelector("#reader");
let action = document.querySelector("#action");
let tags = document.querySelector("#tags");
let title = document.querySelector("#title");
let content = document.querySelector("#content");
let name = document.querySelector("#name");
let password = document.querySelector("#password");
let loader = document.querySelector("#loader");

String.prototype.hashCode = function() {
  var hash = 0;
  for (var i = 0; i < this.length; i++) {
      var char = this.charCodeAt(i);
      hash = ((hash<<5)-hash)+char;
      hash = hash & hash;
  }
  return '!' + hash.toString(32);
}

function router() {
  let path = location.hash.split('/')
  if(path[0] == '#article') {
    showReader(path[1])
  }
  if(path[0] == '#feed' || path[0] == '') {
    showFeed()
  }
  if(path[0] == '#editor') {
    showEditor()
  }
}

window.onhashchange = router
router()

let md = markdownit()

localStorage.articles = localStorage.articles || '[]'

fetch('/bootstrap.json')
  .then(res => res.text())
  .then(res => localStorage.articles = res)

function search(text) {
  showFeed()
  let model = JSON.parse(localStorage.articles)
  let fuse = new Fuse(model, {
    keys: ['name', 'tripcode', 'title', 'tags', 'content']
  })
  let result = text != '' ? fuse.search(text).map(e => e.item) : model
  console.log(result)
  loadFeed(result)
}

function showLoader() {
  loader.style.visibility = 'visible'
}

function hideLoader() {
  loader.style.visibility = 'hidden'
}

function showEditor() {
  editor.scrollIntoView()
}

function showFeed() {
  feed.scrollIntoView()
}

function showReader(hash) {
  let model = JSON.parse(localStorage.articles)
  let entry = model.find(article => article.hash == hash)
  reader.innerHTML =
  `<div><article>
    <small><strong>${entry.name}</strong> ${entry.tripcode} <time>${new Date(entry.date).toLocaleString()}</time></small>
    <h1>${entry.title}</h1>
    <small>${entry.tags.map(tag => "#" + tag).join(' ')}</small>
    <main>
      ${entry.content}
    </main>
  </article>
  <div>`
  reader.style.display = 'block'
  reader.scrollIntoView()
}

function hideReader() {
  reader.style.display = 'none'
}

function loadFeed(m) {
  showLoader()
  setTimeout(() => {
    let model = m || JSON.parse(localStorage.articles)
    feed.innerHTML = "<div>" +
      model.reverse().map(entry =>
      `<article>
        <small><strong>${entry.name}</strong> ${entry.tripcode} <time>${new Date(entry.date).toLocaleString()}</time></small>
        <h1>${entry.title}</h1>
        <small>${entry.tags.map(tag => "#" + tag).join(' ')}</small>
        <main>
          ${entry.content.split('\n').slice(0, 8).join('\n')}
        </main>
        <footer><button onclick='location.href="#article/${entry.hash}"'>Читать</button></footer>
      </article>`).join('') + "</div>"

      if(feed.innerHTML == '<div></div>') feed.innerHTML = "<center><h1>К сожалению, ничего не найдено 😐️</h1></center>";
    hideLoader()
  }, 1000)
}

function sendArticle() {
  let model = JSON.parse(localStorage.articles)
  let hash = (name.value + title.value + password.value + tags.value).hashCode()
  let entry = {
    name: name.value,
    tripcode: password.value.hashCode(),
    title: title.value,
    tags: tags.value.split(',').map(tag => tag.trim()),
    content: md.render(content.value),
    hash,
    date: new Date().getTime()
  }
  localStorage.articles = JSON.stringify(model.concat([entry]))
  loadFeed()
  showReader(hash)
}

loadFeed()
