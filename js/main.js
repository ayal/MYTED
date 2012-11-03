tedtrack("hit", ["hey!"]);

$('body').append($('<div />').text(JSON.stringify(TEDLY.context)));