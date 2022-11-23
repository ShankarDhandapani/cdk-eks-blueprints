// lib/certmanager_addon.ts
import { ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import merge from "ts-deepmerge";
import { ClusterInfo, Values } from "../../spi";
import { createNamespace } from "../../utils";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";
/**
 * User provided option for the Helm Chart
 */
export interface AckAddOnProps extends HelmAddOnUserProps {
    
    /**
     * Name of the ack controller
     * @default iam-chart
     */
    name?: string;
    /**
     * Version of the ack controller
     * @default v0.0.13
     */
    version?: string;
    /**
     * Managed IAM Policy of the ack controller
     * @default IAMFullAccess
     */
    managedPolicyName?: string;
    /**
     * To Create Namespace using CDK. This should be done only for the first time.
     */    
    createNamespace?: boolean;
}

/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps: HelmAddOnProps & AckAddOnProps = {
  name: "iam-chart",
  namespace: "ack-system",
  chart: "iam-chart",
  version: "v0.0.13",
  release: "iam-chart",
  repository: `oci://public.ecr.aws/aws-controllers-k8s/iam-chart`,
  values: {},
  managedPolicyName: "IAMFullAccess",
  createNamespace: true
};

/**
 * Main class to instantiate the Helm chart
 */
export class AckAddOn extends HelmAddOn {

  readonly options: AckAddOnProps;

  constructor(props?: AckAddOnProps) {
    super({...defaultProps, ...props});
    this.options = this.props as AckAddOnProps;
  }

  deploy(clusterInfo: ClusterInfo): Promise<Construct> {
    const cluster = clusterInfo.cluster;
    let values: Values = populateValues(this.options);
    values = merge(values, this.props.values ?? {});

    const sa = cluster.addServiceAccount(`${this.options.name}-sa`, {
      namespace: this.options.namespace,
      name: this.options.name,
    });

    sa.node.addDependency(this.options.namespace!);
    sa.role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(this.options.managedPolicyName!));

    if( this.options.createNamespace == true){
      // Let CDK Create the Namespace
      const namespace = createNamespace(this.options.namespace! , cluster);
      const chart = this.addHelmChart(clusterInfo, values);
      chart.node.addDependency(namespace);
      return Promise.resolve(chart);

    } else {
      //Namespace is already created
      const chart = this.addHelmChart(clusterInfo, values);
      return Promise.resolve(chart);
    }
    
  }
}

/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions: AckAddOnProps): Values {
  const values = helmOptions.values ?? {};
  return values;
}
