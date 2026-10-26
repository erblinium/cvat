import { ObjectState, ShapeType } from 'cvat-core-wrapper';

type SemanticAttribute = {
    defaultValue: string;
    name: string;
};

function adjacentPairs(length: number): [number, number][] {
    return Array.from(
        { length: Math.floor(length / 2) },
        (_, index) => [index * 2, index * 2 + 1],
    );
}

function semanticLeftRightPairs(objectState: ObjectState): [number, number][] | null {
    const elementIndexByLabel = new Map<string, number>(
        objectState.elements.map((element: ObjectState, index: number) => [element.label.name, index]),
    );
    const elementLabelBySemanticName = new Map<string, string>(
        (objectState.label.attributes as SemanticAttribute[]).map(
            (attribute): [string, string] => [attribute.defaultValue, attribute.name],
        ),
    );
    const lateralNames = [...elementLabelBySemanticName.keys()].filter(
        (name) => name.startsWith('left-') || name.startsWith('right-'),
    );
    if (!lateralNames.length) {
        return null;
    }

    const pairs: [number, number][] = [];
    for (const leftName of lateralNames.filter((name) => name.startsWith('left-'))) {
        const rightName = `right-${leftName.slice('left-'.length)}`;
        const leftLabel = elementLabelBySemanticName.get(leftName);
        const rightLabel = elementLabelBySemanticName.get(rightName);
        const leftIndex = leftLabel === undefined ? undefined : elementIndexByLabel.get(leftLabel);
        const rightIndex = rightLabel === undefined ? undefined : elementIndexByLabel.get(rightLabel);
        if (leftIndex === undefined || rightIndex === undefined) {
            return null;
        }
        pairs.push([leftIndex, rightIndex]);
    }

    return pairs.length * 2 === lateralNames.length ? pairs : null;
}

export default function flipSkeletonState(objectState: ObjectState): boolean {
    const state = objectState;
    if (state.shapeType !== ShapeType.SKELETON || state.elements.length < 2) {
        return false;
    }

    const elementPoints = state.elements.map((element: ObjectState) => (
        [...element.points as number[]]
    ));
    const pairs = semanticLeftRightPairs(state) ?? adjacentPairs(elementPoints.length);
    for (const [firstIndex, secondIndex] of pairs) {
        const firstElement = state.elements[firstIndex];
        const secondElement = state.elements[secondIndex];

        if (firstElement.outside !== secondElement.outside) {
            [firstElement.outside, secondElement.outside] = [secondElement.outside, firstElement.outside];
        }
        if (firstElement.occluded !== secondElement.occluded) {
            [firstElement.occluded, secondElement.occluded] = [secondElement.occluded, firstElement.occluded];
        }

        [elementPoints[firstIndex], elementPoints[secondIndex]] = [
            elementPoints[secondIndex], elementPoints[firstIndex],
        ];
    }

    state.points = elementPoints.flat();
    return true;
}
