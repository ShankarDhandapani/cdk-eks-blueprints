import { ClusterInfo } from "../../spi";
import { HelmAddOn, HelmAddOnProps, HelmAddOnUserProps } from "../helm-addon";

/**
 * Configuration options for the add-on.
 */
type NodeProblemDetectorAddOnProps = HelmAddOnUserProps;

/**
 * Defaults options for the add-on
 */
const defaultProps: HelmAddOnProps = {
  chart: "node-problem-detector",
  repository: "https://github.com/kubernetes/node-problem-detector.git",
  version: "1.0.0",
  release: "blueprints-addon-node-problem-detector",
  name: "node-problem-detector",
  namespace: "kube-system",
};

export class NodeProblemDetectorAddOn extends HelmAddOn {
  private options: NodeProblemDetectorAddOnProps;

  constructor(props?: NodeProblemDetectorAddOnProps) {
    super({ ...defaultProps, ...props });
    this.options = this.props;
  }

  deploy(clusterInfo: ClusterInfo): void {
    this.addHelmChart(clusterInfo, this.options.values);
  }
}
