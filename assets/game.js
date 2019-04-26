// people watching can bet on who wins
// print win/lose message

// possible functions needed:
//  resolve bets of spectators
// LOOK INTO IFRAMES FOR MAKING THE LIST OF SPECTATORS SCROLLABLE/CHAT

var config = {
  apiKey: "AIzaSyCALSaL8nysc9Qbku7sitDhFW4eCSknEaA",
  authDomain: "rps-multiplayer-fda3b.firebaseapp.com",
  databaseURL: "https://rps-multiplayer-fda3b.firebaseio.com",
  projectId: "rps-multiplayer-fda3b",
  storageBucket: "",
  messagingSenderId: "919785363744"
};
firebase.initializeApp(config);

var database = firebase.database();

// *********************************************************************************************************
var timer = {
  //    HOW TO FIX LATENCY?    TIMER DELAYED ON ONE OF THE PLAYERS SOMETIMES       ONE PLAYER CLEARS INTERVAL BEFORE OTHER GETS THERE?
  currentTime: 0,
  timerSpace: $("#timer-space"),
  interval: 0,
  startTime: function() {
    timer.currentTime = 30;
    clearInterval(timer.interval);
    timer.interval = setInterval(function() {
      console.log(timer.currentTime);
      game.timerCheck();
      //if (player.MyChoice !== "nothing" && player.enemyChoice !== "")
      timer.timerSpace.text(timer.currentTime);
      if (timer.currentTime < 1) {
        // setTimeout(function() {
        //   //game.checkChoices();
        //   database.ref("choicing").update({
        //     choicing: true
        //   });
        // }, 500);
        database.ref("choicing").update({
          choicing: true
        });
      }
      if (timer.currentTime < 11) {
        timer.timerSpace.css("font-weight", "bold");
        timer.timerSpace.css("color", "red");
      } else {
        timer.timerSpace.css("color", "black");
        timer.timerSpace.css("font-weight", "normal");
      }
      timer.currentTime--;
    }, 1000);
  },
  resetTime: function(interval) {
    clearInterval(interval);
    timer.currentTime = 0;
    timer.timerSpace.text("");
    database.ref("timer").update({
      timerOn: false
    });
  }
};
// *********************************************************************************************************
var game = {
  playButton: $("#play-button"),
  timerOn: false,
  choicing: false,
  updateDataInfo: function() {
    database.ref().on("value", function(snapshot) {
      $("#king-name").text(snapshot.child("kingName").val());
      $("#challenger-name").text(snapshot.child("challengerName").val());
      if (player.king) {
        player.enemyChoice = snapshot.child("challengerChoice").val();
      } else {
        player.enemyChoice = snapshot.child("kingChoice").val();
        player.spectatorChoice = snapshot.child("challengerChoice").val();
      }
    });
    database.ref("chat").on("value", function(chatsnap) {
      var message = $("<p>").text(chatsnap.child("chatMessage").val());
      chat.chatRoom.prepend(message);
    });
    database.ref("timer").on("value", function(timerSnap) {
      game.timerOn = timerSnap.child("timerOn").val();
      if (game.timerOn === true && timer.currentTime === 0) {
        timer.startTime();
      } else if (game.timerOn === false) {
        timer.resetTime();
      }
    });
    database.ref("choicing").on("value", function(choiceSnap) {
      game.choicing = choiceSnap.child("choicing").val();
      console.log("choicing-active");
      if (game.choicing === true) {
        game.checkChoices();
      }
    });
  },
  playButtonHandler: function() {
    //in future create an array of spectators then on turn reveal play button
    if ($("#king-name").text() !== "" || $("#challenger-name").text() !== "") {
      game.playButton.hide();
    } else {
      if (player.myChoice === "nothing") {
        setTimeout(function() {
          game.playButton.show();
        }, 500);
      } else {
        setTimeout(function() {
          game.playButton.show();
        }, 5000);
      }
    }
    game.playButton.on("click", function() {
      player.initializePlayer(); //possible bug with multiple people clicking play at once?
      game.playButton.hide();
    });
  },
  timerCheck: function() {
    if ($("#king-name").text() !== "" && $("#challenger-name").text() !== "") {
      database.ref("timer").update({
        timerOn: true
      });
    } else {
      database.ref("timer").update({
        timerOn: false
      });
    }
  },
  hideButtons: function() {
    //hide guess buttons player loss
    $(".choices").remove();
  },
  checkChoices: function() {
    //               PROBLEM WITH NOT MAKING A CHOICE  CHECK CHOICES NOT BEING FIRED BY CHALLENGER   ONLY PRINTS RESULTS TO ONE PLAYER
    console.log(player.myChoice);
    console.log(player.enemyChoice);
    console.log(game.timerOn);
    console.log(timer.currentTime);
    timer.resetTime(timer.interval);
    if (player.myChoice !== "nothing") {
      player.myChoiceSpace.text(player.myChoice);
      player.enemyChoiceSpace.text(player.enemyChoice);
      if (player.enemyChoice === player.myChoice) {
        player.myResultSpace.text("TIE");
        player.enemyResultSpace.text("TIE");
        console.log("tie");
      } else if (
        (player.enemyChoice === "rock" && player.myChoice === "paper") ||
        (player.enemyChoice === "paper" && player.myChoice === "scissor") ||
        (player.enemyChoice === "scissor" && player.myChoice === "rock")
      ) {
        player.myResultSpace.text("WINNER");
        player.enemyResultSpace.text("LOSER");

        console.log("you win");
      } else {
        player.myResultSpace.text("LOSER");
        player.enemyResultSpace.text("WINNER");
        player.lives--;
        console.log("you lose");
      }
      player.myChoiceSpace.css("visibility", "visible");
      player.enemyChoiceSpace.css("visibility", "visible");
      player.myResultSpace.css("visibility", "visible");
      player.enemyResultSpace.css("visibility", "visible");
      if (player.lives === 0) {
        console.log("your out!");
        player.onEliminated();
      } else {
        game.timerCheck();
      }
    } else {
      $("#challenger-choice-space").text(player.spectatorChoice);
      $("#king-choice-space").text(player.enemyChoice);
    }
    database.ref().update({
      kingChoice: "",
      challengerChoice: ""
    });
    database.ref("choicing").update({
      choicing: false
    });
    setTimeout(function() {
      player.myChoiceSpace.css("visibility", "hidden");
      player.enemyChoiceSpace.css("visibility", "hidden");
      player.myResultSpace.css("visibility", "hidden");
      player.enemyResultSpace.css("visibility", "hidden");
    }, 3000);
  }
};
// ************************************************************************************************************
var player = {
  king: false,
  name: "",
  nameSpace: $("#name-space"),
  winstreak: 0,
  overallWins: 0,
  overallLosses: 0,
  lives: 3,
  myChoiceSpace: "",
  enemyChoiceSpace: "",
  myResultSpace: "",
  enemyResultSpace: "",
  myChoice: "nothing",
  enemyChoice: "nothing",
  spectatorChoice: "nothing",
  initializePlayer: function() {
    if ($("#king-name").text() === "") {
      player.king = true;
    }
    if (player.king) {
      database.ref().update({
        kingName: player.name //stores playername in database for all to see
      });
      player.myChoiceSpace = $("#king-choice-space");
      player.enemyChoiceSpace = $("#challenger-choice-space");
      player.myResultSpace = $("#king-result-space");
      player.enemyResultSpace = $("#challenger-result-space");
    } else {
      database.ref().update({
        challengerName: player.name // updatePlayerInfo handles actually printing info to sheet
      });
      player.myChoiceSpace = $("#challenger-choice-space");
      player.enemyChoiceSpace = $("#king-choice-space");
      player.myResultSpace = $("#challenger-result-space");
      player.enemyResultSpace = $("#king-result-space");
    }
    $("<p>")
      .text("It's your turn!")
      .appendTo($("#button-space"));
    $("<button class='choices' data-choice='rock'>Rock</button>").appendTo(
      $("#button-space")
    );
    $("<button class='choices' data-choice='paper'>Paper</button>").appendTo(
      $("#button-space")
    );
    $(
      "<button class='choices' data-choice='scissor'>Scissors</button>"
    ).appendTo($("#button-space"));
    player.choiceHandler();
    game.timerCheck();
  },
  nameAsk: function() {
    //try to store name on local storage
    var modal = $("#name-modal");
    var nameSubmit = $("#name-submit");
    var nameData = $("#name-data");
    modal.css("display", "block");
    nameSubmit.on("click", function(event) {
      event.preventDefault();
      if (nameData.val() !== "") {
        player.name = nameData.val();
        player.nameSpace.text(player.name + ":");
        modal.css("display", "none");
        console.log(player.name);
      }
    });
  },
  choiceHandler: function() {
    $(document).on("click", ".choices", function() {
      var userChoice = $(this).attr("data-choice");
      $(".choices").css("background-color", "red");
      $(this).css("background-color", "blue");
      console.log(userChoice);
      player.myChoice = userChoice;
      if (player.king) {
        database.ref().update({
          kingChoice: userChoice
        });
      } else {
        database.ref().update({
          challengerChoice: userChoice
        });
      }
    });
  },
  onEliminated: function() {
    if (player.king) {
      database.ref().update({
        kingName: ""
      });
    } else {
      database.ref().update({
        challengerName: ""
      });
    }
    game.playButtonHandler();
    player.king = false;
    player.myChoice = "nothing";
    player.winstreak = 0;
    player.enemyChoice = "nothing";
    player.spectatorChoice = "nothing";
    player.lives = 3;
    timer.resetTime();
  }
};
// ***************************************************************************************************************
var chat = {
  // PUT CHAT IN SESSION MEMORY? IFRAME THE CHAT SO IT DOESN'T EXTEND FOR ETERNITY
  chatRoom: $("#chat-space"),
  chatInput: $("#chat-input"),
  chatSubmit: $("#chat-submit"),
  sendMessage: function() {
    var message = chat.chatInput.val().trim();
    if (message !== "") {
      database.ref("chat").update({
        chatMessage: player.name + ": " + message
      });
      chat.chatInput.val("");
    }
  },
  initializeChat: function() {
    database.ref("chat").update({
      chatMessage: ""
    });
  }
};
// ***************************************************************************************************************
$(document).ready(function() {
  player.nameAsk();
  chat.initializeChat();
  game.updateDataInfo();
  game.playButtonHandler();
  chat.chatSubmit.on("click", function(event) {
    event.preventDefault();
    chat.sendMessage();
  });
});

// *****************************************ANYTHING NOT ON THE DATABASE IS NOT SHARED ******************************************
