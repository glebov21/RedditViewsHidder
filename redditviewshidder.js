let maxStoreCount = 10000;
let articlesContainer = document.getElementsByTagName('shreddit-feed')[0];
let localStorageSaveKey = "viewedRedditPosts";
let viewedPostsById = new Set();

function LoadSavedViews(){
	let savedJson = localStorage.getItem(localStorageSaveKey);
	if(savedJson){
		const arrFromJson = JSON.parse(savedJson);
		viewedPostsById = new Set(arrFromJson);
		//trim size
		if(viewedPostsById.size > maxStoreCount){
			let arrToTrim = Array.from(viewedPostsById);
			arrToTrim.splice(0, viewedPostsById.size - maxStoreCount)
			viewedPostsById = new Set(arrToTrim);
		}
	}
}

function SaveViews(){
	localStorage.setItem(localStorageSaveKey, JSON.stringify(Array.from(viewedPostsById)));
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