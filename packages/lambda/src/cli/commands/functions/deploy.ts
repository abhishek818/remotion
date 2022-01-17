import {CliInternals} from '@remotion/cli';
import {Log} from '@remotion/cli/dist/log';
import {deployFunction} from '../../../api/deploy-function';
import {
	CURRENT_VERSION, DEFAULT_CLOUDWATCH_RETENTION_PERIOD,
	DEFAULT_MEMORY_SIZE,
	DEFAULT_TIMEOUT,
} from '../../../shared/constants';
import {validateMemorySize} from '../../../shared/validate-memory-size';
import {validateTimeout} from '../../../shared/validate-timeout';
import {parsedLambdaCli} from '../../args';
import {getAwsRegion} from '../../get-aws-region';

export const FUNCTIONS_DEPLOY_SUBCOMMAND = 'deploy';

export const functionsDeploySubcommand = async () => {
	const region = getAwsRegion();
	const timeoutInSeconds = parsedLambdaCli.timeout ?? DEFAULT_TIMEOUT;
	const memorySizeInMb = parsedLambdaCli.memory ?? DEFAULT_MEMORY_SIZE;
	const createCloudWatchLogGroup = !parsedLambdaCli['disable-cloudwatch'];
	const cloudWatchLogRetentionPeriodInDays = parsedLambdaCli['retention-period'] ?? DEFAULT_CLOUDWATCH_RETENTION_PERIOD;

	validateMemorySize(memorySizeInMb);
	validateTimeout(timeoutInSeconds);
	if (!CliInternals.quietFlagProvided()) {
		Log.info(
			CliInternals.chalk.gray(
				`
				Region = ${region},
				Memory = ${memorySizeInMb}MB,
				Timeout = ${timeoutInSeconds}sec,
				Version = ${CURRENT_VERSION},
				CloudWatch Enabled = ${createCloudWatchLogGroup},
				CloudWatch Retention Period = ${cloudWatchLogRetentionPeriodInDays} days
				`
			)
		);
	}

	const output = CliInternals.createOverwriteableCliOutput(
		CliInternals.quietFlagProvided()
	);
	output.update('Deploying Lambda...');
	const {functionName, alreadyExisted} = await deployFunction({
		createCloudWatchLogGroup,
		region,
		timeoutInSeconds,
		memorySizeInMb,
		cloudWatchLogRetentionPeriodInDays,
	});
	if (CliInternals.quietFlagProvided()) {
		Log.info(functionName);
	}

	if (alreadyExisted) {
		output.update(`Already exists as ${functionName}\n`);
	} else {
		output.update(`Deployed as ${functionName}\n`);
	}
};
