let maxStoreCount = 10000;
let articlesContainer = document.getElementsByTagName('shreddit-feed')[0];
let localStorageSaveKey = "viewedRedditPosts";
let localStorageSeparator = ',';
let viewedPostsById = new Set();

function LoadSavedViews(){
	let savedString = localStorage.getItem(localStorageSaveKey);
	if(savedString){
		try{
			let iStart = 0;
			for(let i = 0; i < savedString.length; i++){
				if(savedString[i] == localStorageSeparator){
					viewedPostsById.add(savedString.slice(iStart, i))
					iStart = i+1;
				}
			}
		}catch{
			console.error("Deserialization error");
		}
		//trim size
		if(viewedPostsById.size > maxStoreCount){
			let arrToTrim = Array.from(viewedPostsById);
			arrToTrim.splice(0, viewedPostsById.size - maxStoreCount)
			viewedPostsById = new Set(arrToTrim);
		}
	}
}

function SaveViews(){
	let stringToSave = "";
	for(let viewedId of viewedPostsById)
		stringToSave += viewedId + localStorageSeparator
	localStorage.setItem(localStorageSaveKey, stringToSave);
}

function ForeachPosts(callback){
	let articles = articlesContainer.getElementsByTagName('article');
	for(let article of articles){
		let post = article.getElementsByTagName('shreddit-post')[0];
		callback(article, post, post.id);
	}
}

function RemoveViewedPosts(){
	ForeachPosts((articleEl, postEl, postId)=>{
		if(viewedPostsById.has(postId))
		{
			articleEl.nextSibling.remove(); //remove hr
			articleEl.remove();
		}
	});
}

//START

LoadSavedViews();

//Hide viewedPosts
let newpostObserver = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		if(mutation.addedNodes.length > 0){
			RemoveViewedPosts();
		}
	});
  });

newpostObserver.observe(articlesContainer, {childList: true, subtree: true, characterData: false});

RemoveViewedPosts();

//Catch viewed posts
addEventListener("scroll", (event) => {
	ForeachPosts((articleEl, postEl, postId)=>{
		let bounds = articleEl.getBoundingClientRect();
		if(bounds.bottom < 0) {
			viewedPostsById.add(postId);
		}
	});
});

addEventListener("beforeunload", (event) => {
	SaveViews();
});