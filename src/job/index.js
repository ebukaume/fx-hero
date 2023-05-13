"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Job = void 0;
const toad_scheduler_1 = require("toad-scheduler");
class Job {
    static schedule(input) {
        const scheduler = new toad_scheduler_1.ToadScheduler();
        input.forEach(({ name, cronExpression, executor }) => {
            const task = new toad_scheduler_1.AsyncTask(name, executor, this.handleError.bind(this));
            const job = new toad_scheduler_1.CronJob({ cronExpression }, task, { preventOverrun: true });
            scheduler.addCronJob(job);
        });
    }
    static handleError(err) {
        console.log('Error running job', err.message);
    }
}
exports.Job = Job;
