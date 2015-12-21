hRouter.addFilter('page', function(page) {
    return parseInt(page) > 0;
});

hRouter.route('foo/bar/:page', function(page) {
    window.lastPage1 = parseInt(page);
}).name("page1").setDefault("page", 1);

hRouter.route('foo/bar/:page/:page', function(page1, page2) {
    window.lastPage2 = [parseInt(page1), parseInt(page2)];
}).name("page2").setDefault("page", 1);

hRouter.route('foo/:page/bar', function(page) {
    window.lastPage3 = parseInt(page);
}).name("page3").setDefault("page", 1);

hRouter.route('foo/bar/:word', function(word) {
    window.lastWord5 = word;
}).preRoute(function() {
    return !!window.preRoute;
});


hRouter.route('foo/bar/:word', function(word) {
    window.lastWord = word;
}).name("foobar_word");

hRouter.route(/.+/, function() {
    window.catchAll = document.location.href;
});


function AsyncLoop(vars, done) {
    function run() {
        var fnc = vars.shift();
        if (!fnc) return done();

        fnc(run);
    }

    run();
}

QUnit.test("word1", function(assert) {
    var done = assert.async();
    window.preRoute = false;
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/bar/" + i;
            setTimeout(function() {
                assert.equal(i, window.lastWord);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect("w" + i));
    }
    AsyncLoop(tests, done);
});

QUnit.test("word2", function(assert) {
    var done = assert.async();
    window.preRoute = true;
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/bar/" + i;
            setTimeout(function() {
                assert.equal(i, window.lastWord5);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect("w" + i));
    }
    AsyncLoop(tests, done);
});

QUnit.test("page3", function(assert) {
    var done = assert.async();
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/" + i + "/bar";
            setTimeout(function() {
                assert.equal(i, window.lastPage3);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect(i));
    }
    AsyncLoop(tests, done);
});


QUnit.test("page1", function(assert) {
    var done = assert.async();
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/bar/" + i;
            setTimeout(function() {
                assert.equal(i,  window.lastPage1);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect(i));
    }
    AsyncLoop(tests, done);
});

QUnit.test("page2", function(assert) {
    var done = assert.async();
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/bar/" + i + "/" + (5+i);
            setTimeout(function() {
                assert.equal(i, window.lastPage2[0]);
                assert.equal(i+5, window.lastPage2[1]);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect(i));
    }
    AsyncLoop(tests, done);
});

QUnit.test("catchAll", function(assert) {
    var done = assert.async();
    function redirect(i) {
        return function(next) {
            document.location.href = "#foo/bar/" + i + "/" + (5+i) + "/" + (5+i);
            setTimeout(function() {
                assert.equal(document.location.href, window.catchAll);
                next();
            });
        };
    }
    var tests = [];
    for (var i = 1; i <= 5; i++) {
        tests.push(redirect(i));
    }
    AsyncLoop(tests, done);
});

QUnit.test("invalid_args_generate_url", function(assert) {
    for (var i = 1; i < 50; i++) {
        try {
            hRouter.url("page1", "w" + i);
            assert.ok(false);
        } catch (e) {
            assert.ok(true);
        }
    }
});


QUnit.test("generate_url", function(assert) {
    for (var i = 1; i < 50; i++) {
        assert.equal("#foo/bar/" + i, hRouter.url("page1", i));
        assert.equal("#foo/bar/" + i + "/" + (i+6), hRouter.url("page2", i, i+6));
    }
});
