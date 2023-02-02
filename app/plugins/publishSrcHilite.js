JSDOC.PluginManager.registerPlugin(
	"JSDOC.publishSrcHilite",
	{
		onPublishSrc: function(src) {
			if (src.path in JsHilite.cache) {
				return; // already generated src code
			}
			else JsHilite.cache[src.path] = true;
		
			try {
				var sourceCode = IO.readFile(src.path);
			}
			catch(e) {
				print(e.message);
				quit();
			}

			var hiliter = new JsHilite(sourceCode, src.charset);
			src.hilited = hiliter.hilite();
		}
	}
);

function JsHilite(src, charset) {
	var tr = new JSDOC.TokenReader();
	tr.keepComments = true;
	tr.keepDocs = true;
	tr.keepWhite = true;
	
	this.tokens = tr.tokenize(new JSDOC.TextStream(src));
	//체크용
	var flag=0;
	for (var i=0;i<this.tokens.length;i++) {
		var temp=this.tokens[i].toString()
		//주석 발견 시 flag를 on
		if("<COMM name=\"JSDOC\">"==this.tokens[i].toString().substring(0,19)){
			flag=1;
		}
		
		if(flag==1 && "<NAME name=\"NAME\">"==this.tokens[i].toString().substring(0,18)){		
			flag=0;
			//이름입력 토큰 찾음	
			
			var start=0, end=0, subflag=0;
			for(var j=0; j<this.tokens[i].toString().length; j++){
				if(subflag==0 && this.tokens[i].toString()[j]==">"){
					start=j+1;
					subflag++;
				}
				if(subflag==1 && this.tokens[i].toString()[j]=="<"){
					end=j;
					subflag++;
				}
			}
			if(subflag==2){
				//start와 end를 찾았다.
				this.tokens[i].appendName=this.tokens[i].toString().substring(start,end);
			}
			
		}
		//newline 다음 첫번째 name를 발견하면 flag off
	}
	
	/*
	찾아낸 함수에 appendName이 잘 붙었나 확인하는 코드
	print("func sorting end\n");
	for (i=0;i<this.tokens.length;i++){
		if(this.tokens[i].appendName !=undefined)
			print(this.tokens[i].appendName);
	}
	*/
	
	
	
	
	
	// TODO is redefining toString() the best way?
	JSDOC.Token.prototype.toString = function() { 
		if(this.appendName !=undefined)
			return "<a name=\""+this.appendName+"\"></a>"+"<span class=\""+this.type+"\">"+this.data.replace(/</g, "&lt;")+"</span>";
		else 
		return "<span class=\""+this.type+"\">"+this.data.replace(/</g, "&lt;")+"</span>";
	}
	
	if (!charset) charset = "utf-8";
	
	this.header = '<html><head><meta http-equiv="content-type" content="text/html; charset='+charset+'"> '+
	"<style>\n\
	.KEYW {color: #933;}\n\
	.COMM {color: #bbb; font-style: italic;}\n\
	.NUMB {color: #393;}\n\
	.STRN {color: #393;}\n\
	.REGX {color: #339;}\n\
	.line {border-right: 1px dotted #666; color: #666; font-style: normal;}\n\
	</style></head><body><pre>";
	this.footer = "</pre></body></html>";
	this.showLinenumbers = true;
}

JsHilite.cache = {};

JsHilite.prototype.hilite = function() {
	var hilited = this.tokens.join("");
	var line = 1;
	if (this.showLinenumbers) hilited = hilited.replace(/(^|\n)/g, function(m){return m+"<span class='line'>"+((line<10)? " ":"")+((line<100)? " ":"")+(line++)+"</span> "});
	
	return this.header+hilited+this.footer;
}