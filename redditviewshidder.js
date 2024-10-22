const articlesContainer = document.getElementsByTagName('shreddit-feed')[0];
const storageSaveKey = "viewedRedditPosts";
const storageSeparator = ',';

const oneRecordSizeBytes = 10;
const browserMaxStoreSizeBytes = 8192;
const maxStoreCount = browserMaxStoreSizeBytes / (oneRecordSizeBytes + storageSeparator.length) - 2; //(744) -2 Just in case

let thisBrowser = (browser)? browser : chrome;
if(!thisBrowser)
	thisBrowser = (window.browser) ? window.browser : window.chrome;
let storage = thisBrowser.storage.sync;

let viewedPostsById = new Set();

async function LoadSavedViewsAsync(){
	console.log("LoadSavedViewsAsync");
	let obj = await storage.get(storageSaveKey);
	if(obj && obj.hasOwnProperty(storageSaveKey)){
		console.log("found saves");
		savedString = obj[storageSaveKey];
		try{
			let iStart = 0;
			for(let i = 0; i < savedString.length; i++){
				if(savedString[i] == storageSeparator){
					viewedPostsById.add(savedString.slice(iStart, i))
					iStart = i+1;
				}
			}
		}catch{
			console.error("Deserialization error");
		}
	}
}

async function SaveViewsAsync(){
	console.log("SaveViewsAsync");
	//trim size (remove half on max)
	let arrayOrSetToSave = viewedPostsById;
	if(viewedPostsById.size > maxStoreCount){
		arrayOrSetToSave = Array.from(viewedPostsById);
		arrayOrSetToSave.splice(0, maxStoreCount / 2)
	}

	let stringToSave = "";
	for(let viewedId of arrayOrSetToSave)
		stringToSave += viewedId + storageSeparator;

	var saveObj = {};
	saveObj[storageSaveKey] = stringToSave;
	await storage.set(saveObj);
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

function StartObservers(){
	console.log("StartObservers");
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
	document.addEventListener("scroll", (event) => {
		ForeachPosts((articleEl, postEl, postId)=>{
			let bounds = articleEl.getBoundingClientRect();
			if(bounds.bottom < 0) {
				viewedPostsById.add(postId);
			}
		});
	});
	
	window.addEventListener("beforeunload", (event) => {
		_ = SaveViewsAsync();
	});
}

if (document.readyState !== 'loading') 
	Main()
else 
	document.addEventListener('DOMContentLoaded', Main);
	
async function Main() {
	console.log("Main");
	await LoadSavedViewsAsync();
	StartObservers();
}