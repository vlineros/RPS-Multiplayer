// somehow restrict the input to only 2 people playing on the site (the rest watch)
// people watching can bet on who wins
// timer counts down to let players know they need to give an input
// capture user key input and store in a variable on the server
// print the variable to the screen from the server
// compare user1 input with user 2 and decide winner
// print win/lose message
// update win counts and if one player has beaten another 3 times the loser is taken off the server (<- maybe)
// NEED TO INITIALIZE FIREBASE
// give spectators class (spectator)

// possible functions needed:
//  create new spectator when new id joins server
//  countdown timer to vote rock paper or scissors
//  calculate win between two players
//  resolve bets of spectators
//  set up objects for player cards and store on server for re-login
//  try to use objects as much as possible
// LOOK INTO IFRAMES FOR MAKING THE LIST OF SPECTATORS SCROLLABLE

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
  //put timer info on database?
  currentTime: 0,
  timerSpace: $("#timer-space"),
  startTime: function() {
    timer.currentTime = 25;
    clearInterval(interval);
    var interval = setInterval(function() {
      timer.timerSpace.text(timer.currentTime);
      if (timer.currentTime === 0) {
        clearInterval(interval);
        game.checkChoices();
        game.hideButtons();
      }
      if (timer.currentTime < 11) {
        timer.timerSpace.css("font-weight", "bold");
        timer.timerSpace.css("color", "red");
      }
      timer.currentTime--;
    }, 1000);
  }
};
// *********************************************************************************************************
var game = {
  playerCount: 0,
  playButton: $("#play-button"),
  updatePlayerInfo: function() {
    database.ref().on("value", function(snapshot) {
      game.playerCount = snapshot.child("playerCount").val();
      console.log(game.playerCount);
      $("#king-name").text(snapshot.child("kingName").val());
      $("#challenger-name").text(snapshot.child("challengerName").val());
      if ((player.king = true)) {
        player.enemyChoice = snapshot.child("challengerChoice").val();
      } else {
        player.enemyChoice = snapshot.child("kingChoice").val();
        player.spectatorChoice = snapshot.child("challengerChoice").val();
      }
    });
    // possible fix for people disconnecting?
  },
  playButtonHandler: function() {
    //in future create an array of spectators then on turn reveal play button
    if (game.playerCount < 2) {
      if (player.myChoice === "nothing") {
        setTimeout(function() {
          game.playButton.show();
        }, 500);
      } else {
        setTimeout(function() {
          game.playButton.show();
        }, 5000);
      }
    } else {
      game.playButton.hide();
    }
    game.playButton.on("click", function() {
      player.initializePlayer(); //possible bug with multiple people clicking play at once?
      game.playButton.hide();
    });
  },
  timerCheck: function() {
    if (game.playerCount > 1) {
      timer.startTime();
    }
  },
  hideButtons: function() {
    //hide guess buttons while showing answers
    $(".choices").hide();
    setTimeout(function() {
      $(".choices").show();
    }, 5000);
  },
  checkChoices: function() {
    if (player.myChoice !== "nothing") {
      player.choiceSpace.text(player.myChoice);
      player.enemyChoiceSpace.text(player.enemyChoice);
      if (player.enemyChoice === player.myChoice) {
        console.log("tie");
      } else if (
        (player.enemyChoice === "rock" && player.myChoice === "paper") ||
        (player.enemyChoice === "paper" && player.myChoice === "scissor") ||
        (player.enemyChoice === "scissor" && player.myChoice === "rock")
      ) {
        console.log("you win");
      } else {
        player.lives--;
        console.log("you lose");
      }
    } else {
      $("#challenger-choice-space").text(player.spectatorChoice);
      $("#king-choice-space").text(player.enemyChoice);
    }
    if (player.lives === 0) {
      console.log("your out!");
      player.onEliminated();
    } else {
      timer.startTime();
    }
    database.ref().update({
      kingChoice: "",
      challengerChoice: ""
    });
  }
};
// ************************************************************************************************************
var player = {
  // create variable ID that stores whether king or not
  king: false,
  name: "",
  winstreak: 0,
  overallWins: 0,
  overallLosses: 0,
  lives: 3,
  choiceSpace: "",
  enemyChoiceSpace: "",
  myChoice: "nothing",
  enemyChoice: "nothing",
  spectatorChoice: "nothing",
  initializePlayer: function() {
    if (game.playerCount < 1) {
      player.king = true;
    }
    game.playerCount++;
    database.ref().update({
      playerCount: game.playerCount
    });
    if (player.king === true) {
      database.ref().update({
        kingName: player.name //stores playername in database for all to see
      });
      player.choiceSpace = $("#king-choice-space");
      player.enemyChoiceSpace = $("#challenger-choice-space");
    } else {
      database.ref().update({
        challengerName: player.name // updatePlayerInfo handles actually printing info to sheet
      });
      player.choiceSpace = $("#challenger-choice-space");
      player.enemyChoiceSpace = $("#king-choice-space");
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
    game.timerCheck(); //looks to see if timer is ok to start based on playerCount
  },
  nameAsk: function() {
    //try to store name on local storage
    var modal = $("#name-modal");
    var nameSubmit = $("#name-submit");
    var nameData = $("#name-data");
    modal.css("display", "block");
    nameSubmit.on("click", function(event) {
      event.preventDefault();
      player.name = nameData.val();
      modal.css("display", "none");
      console.log(player.name);
    });
  },
  choiceHandler: function() {
    $(document).on("click", ".choices", function() {
      var userChoice = $(this).attr("data-choice");
      $(".choices").css("background-color", "light blue");
      $(this).css("background-color", "dark blue");
      console.log(userChoice);
      player.myChoice = userChoice;
      if ((player.king = false)) {
        database.ref().update({
          challengerChoice: userChoice
        });
      } else {
        database.ref().update({
          kingChoice: userChoice
        });
      }
    });
  },
  onEliminated: function() {
    game.playerCount--;
    database.ref().update({
      playerCount: game.playerCount
    });
    game.playButtonHandler();
    player.king = false;
    player.myChoice = "nothing";
    player.winstreak = 0;
    player.enemyChoice = "nothing";
    player.spectatorChoice = "nothing";
    player.lives = 3;
  }
  // when player eliminated reduce playerCount by 1/ remove play buttons/ and show play button to others
};
// ***************************************************************************************************************
$(document).ready(function() {
  player.nameAsk();
  game.updatePlayerInfo();
  game.playButtonHandler();
});
// NEED TO AUTHORIZE ONLY SPECIFIC USER IDS TO WRITE TO /MAINPLAYERCHOICES (IN FIREBASE RULES)
// *****************************************ANYTHING NOT ON THE DATABASE IS NOT SHARED ******************************************
