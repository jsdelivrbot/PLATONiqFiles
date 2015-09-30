(function() {
    var response_forquizApp = function(path) {
        var fb = new Firebase("https://quizbox.firebaseio.com/");
        if(!fb.getAuth()) {
            location.assign("/login");
        }
        var pathSplit = path.split("/");
        console.log(pathSplit);
        var className = pathSplit[2];
        var quizName = pathSplit[3];
        var classPath = fb.child("teachers/" + className);
        var quizPath = classPath.child("quiz/" + quizName);
        var questionsPath = quizPath.child("question");
        //ooh! Variable names with underscores! How fyancy!
        var _cmURL = "/manage/" + className;
        var _qmURL = "/manage/" + className + "/q/" + quizName;
        var doMonitorResponses = function(quiz) {
            var quizName_hr = quiz.name; //Nice naming conventions, bruv
            $('.quizName').text(quizName_hr);
            $('#quizLink').attr("href", _qmURL);
            $('.className').text(className);
            $('#classLink').attr("href", _cmURL);
            var firstQuestion = quiz.firstQuestion;
            var firstQuestionPath = questionsPath.child(firstQuestion);
            var usersPath = firstQuestionPath.child("answer");
            var renderStudent = function(uid) {
                var studentUserPath = fb.child("users/" + uid);
                var sN = studentUserPath.child("name");
                sN.once("value", function(uName) {
                    var u = uName.val();
                    var element = "\
<div data-uid='" + uid + "' class='response col-md-12'>\
<div class='panel panel-default'><div class='panel-body'>\
<a href='#' class='response_openDrawer' data-uid='" + uid + "'><h3>" + u + "</h3></a>\
<div class='responseDrawer row' data-uid='" + uid + "'>\
\
</div>\
</div></div>\
</div>";
                    $(element).css({
                        scale: 0
                    }).appendTo('#cardboard').transition({
                        scale: 1
                    });
                    $('.responseDrawer[data-uid="' + uid + '"]').hide();
                    var renderAnswers = function(uid) {
                        console.log(uid);
                        $('.responseDrawer[data-uID="' + uid + '"]').html("");
                        for(var q in quiz.question) {
                            if(quiz.question[q].answer && quiz.question[q].answer[uid]) {
                                var num = quiz.question[q].content.num;
                                var ans = quiz.question[q].answer[uid];
                                console.log(ans);
                                console.log(num);
                                var _colour = "default";
                                if(ans.g == true) {
                                    _colour = "success";
                                } else if(quiz.question[q].content.settings.checkAnswers) {
                                    _colour = "danger";
                                }
                                $('.responseDrawer[data-uid="' + uid + '"]').append("\
\<div class='col-md-3'><div class='panel panel-" + _colour + "'><div class='panel-heading'><h3 class='panel-title'>" + num + "</h3></div><div class='panel-body'><h3>" + ans.a + "</h3></div></div></div>")
                            } else {
                                var num = quiz.question[q].content.num;
                                $('.responseDrawer[data-uid="' + uid + '"]').append("\
\<div class='col-md-3'><div class='panel panel-" + _colour + "'><div class='panel-heading'><h3 class='panel-title'>" + num + "</h3></div><div class='panel-body'><h3>N/A</h3></div></div></div>")
                            }
                        }
                    };
                    $('.response_openDrawer').off("click").click(function(e) {
                        e.preventDefault();
                        $('.responseDrawer[data-uid="' + $(this).attr("data-uid") + '"]').slideToggle();
                        renderAnswers($(this).attr("data-uid"));
                    });
                });
            };
            usersPath.on("child_added", function(newChildSnap) {
                var nS = newChildSnap;
                var uid = nS.key();
                renderStudent(uid);
            });
        };
        //verify ownership & existence
        //must be a tough conversation :/
        classPath.child("/owner").once("value", function(classOwnerSnap) {
            if(classOwnerSnap.val() == fb.getAuth().uid) {
                console.log("Confirmed ownership.");
                quizPath.once("value", function(quizSnap) {
                    if(quizSnap.val() != null) {
                        console.log("Confirmed quiz existence, starting...");
                        doMonitorResponses(quizSnap.val());
                    }
                });
            } else {
                location.assign("/dash");
            }
        });
    };
    response_forquizApp(location.pathname);
})();