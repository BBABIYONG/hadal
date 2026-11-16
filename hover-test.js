(function(){
  var S=[["A","천천히 떠오름","흐릿한 색이 물속에서 떠오르듯 서서히 선명해지고, 카드가 살짝 올라옵니다."],
         ["B","수면의 일렁임","색이 돌아오는 동안 그림이 물결처럼 잠깐 일렁였다가 가라앉습니다."],
         ["C","위에서 내려오는 빛","수면에서 내려온 빛줄기가 위에서부터 그림을 비추며 색이 드러납니다."],
         ["D","신호가 잡힘","잠깐 지직거린 뒤 신호가 잡히듯 색이 또렷하게 고정됩니다."],
         ["E","고요함","고른 카드만 조용히 색을 띠고, 나머지는 어둠 속으로 가라앉습니다."]];
  var C=[["츠지 마코토","images/tsuji-makoto.webp"],["핑크","images/tsuji-pink.webp"],["츠지 텟페이","images/tsuji-teppei.webp"]];
  document.getElementById("secs").innerHTML=S.map(function(s){
    return '<section class="'+s[0]+'"><h2>'+s[0]+' — '+s[1]+'</h2><p class="d">'+s[2]+'</p><div class="row">'+
      C.map(function(c){return '<a class="spec" href="#"><div class="pic"><img class="base" src="'+c[1]+'" alt=""><img class="col" src="'+c[1]+'" alt=""></div><h3>'+c[0]+'</h3></a>';}).join("")+'</div></section>';
  }).join("");
  document.addEventListener("click",function(e){if(e.target.closest(".spec"))e.preventDefault();});
  document.addEventListener("contextmenu",function(e){if(e.target.closest(".pic"))e.preventDefault();});
})();
