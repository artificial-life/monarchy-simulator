"use stric";

module.exports = function canAct(hero) {
	if (!hero) {
		console.log('No such hero');
		return false;
	}

	if (hero.status == "wandering") {
		console.log('%s is %s', hero.name, hero.status);
		return false;
	}
	if (hero.status == "dead") {
		var count = 0;
		var poses = ["~(x_x~) ", " (~x_x)~", "-(x_x-) ", " (-x_x)-"];
		var int = setInterval(function() {

			process.stdout.write(hero.name + ' can only ' + poses[count % poses.length] + "\r");
			count++;
			if (count > 10) {
				clearInterval(int);
				process.stdout.clearLine();
				console.log('go ahead...');
			}
		}, 500);

		return false;
	}

	return true;
};
