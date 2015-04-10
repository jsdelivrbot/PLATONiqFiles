(function() {
    var respApp = function(path) {
        var parsedPath = path.split("/");
        var className = parsedPath[2];
        var quizName = parsedPath[3];
        var queName = parsedPath[4];
        var fb = new Firebase('https://quizbox.firebaseio.com/');
        if(!fb.getAuth()) {
            location.assign("/login");
        }
        var classPath = fb.child("teachers/" + className);
        var quizPath = classPath.child("quiz/" + quizName);
        if(queName) {
            var quePath = quizPath.child("question/" + queName);
            var answerPath = quePath.child("answer");
            var contentPath = quePath.child("content");
            contentPath.once("value", function(contentSnap) {
                var content = contentSnap.val();
                var settings = content.settings;
                var query = content.query;
                var num = content.num;
                $('.queNum').text(num);
                $('.className').text(className).attr("href", "/manage/" + className);
                quizPath.child("name").once("value", function(quizNameSnap) {
                    var quizNameHR = quizNameSnap.val();
                    $('.quizName').text(quizNameHR).attr("href", "/manage/" + className + "/q/" + quizName);
                });
                var isCorrectAnswer = settings.checkAnswers;
                answerPath.on("child_added", function(nCSnap) {
                    var user = nCSnap.key();
                    var answerO = nCSnap.val();
                    var answer = answerO.a;
                    var isCorrect = answerO.g;
                    fb.child("users/" + user + "/name").once("value", function(userNameSnap) {
                        $('.ansCont[data-uname="' + user + '"]').remove();
                        if(userNameSnap.val() != null) {
                            $('#cardboard').append("<div class='col-md-12 ansCont' data-uname='" + user + "'><div class='panel " + (isCorrectAnswer ? (isCorrect ? "panel-success" : "panel-danger") : "panel-default") + "'><div class='panel-heading'><h3 class='panel-title'>" + userNameSnap.val() + "</h3></div><div class='panel-body'><p>" + answer + "</p></div></div></div>");
                        }
                    });
                });
            });
        } else {}
    };
    respApp(location.pathname);
})();