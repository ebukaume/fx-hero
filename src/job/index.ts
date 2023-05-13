
import { ToadScheduler, AsyncTask, CronSchedule, CronJob } from 'toad-scheduler';

interface JobInput {
  name: string;
  cronExpression: string;
  executor(): Promise<void>;
}

export class Job {
  static schedule(input: JobInput[]): void {
    const scheduler = new ToadScheduler();

    input.forEach(({ name, cronExpression, executor }) => {
      const task = new AsyncTask(
        name,
        executor,
        this.handleError.bind(this),
      )
      const job = new CronJob({ cronExpression }, task, { preventOverrun: true })

      scheduler.addCronJob(job)
    });
  }

  static handleError(err: Error): void {
    console.log('Error running job', err.message);
  }
}
